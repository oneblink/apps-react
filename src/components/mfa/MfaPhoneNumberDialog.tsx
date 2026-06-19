import * as React from 'react'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  Box,
} from '@mui/material'
import useBooleanState from '../../hooks/useBooleanState'
import useMfa from '../../hooks/useMfa'
import InputField from '../InputField'

const PHONE_VERIFICATION_RESEND_COOL_DOWN_SECONDS = 60

function getResendCoolDownRemainingSeconds(
  sentAt: number | undefined,
  now: number,
) {
  if (!sentAt) {
    return 0
  }

  const elapsedSeconds = Math.floor((now - sentAt) / 1000)
  return Math.max(
    0,
    PHONE_VERIFICATION_RESEND_COOL_DOWN_SECONDS - elapsedSeconds,
  )
}

function usePhoneVerificationResendCoolDown(sentAt: number | undefined) {
  const [now, setNow] = React.useState(() => Date.now())

  const remainingSeconds = getResendCoolDownRemainingSeconds(sentAt, now)

  React.useEffect(() => {
    if (!sentAt) {
      return
    }

    const remaining = getResendCoolDownRemainingSeconds(sentAt, Date.now())
    if (remaining <= 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [sentAt])

  return remainingSeconds
}

function MfaPhoneNumberDialog() {
  const {
    isPhoneNumberDialogOpen,
    mfaSettings,
    phoneVerificationCodeSentAt,
    closePhoneNumberDialog,
    savePhoneNumber,
    verifyPhoneNumber,
    resendPhoneNumberVerificationCode,
  } = useMfa()

  const isPhoneVerificationRequired = phoneVerificationCodeSentAt !== undefined

  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [verificationCode, setVerificationCode] = React.useState('')
  const resendCoolDownSeconds = usePhoneVerificationResendCoolDown(
    phoneVerificationCodeSentAt,
  )
  const [isSaving, startSaving, stopSaving] = useBooleanState(false)
  const [isResending, startResending, stopResending] = useBooleanState(false)

  React.useEffect(() => {
    if (isPhoneNumberDialogOpen) {
      setPhoneNumber(mfaSettings.sms.phoneNumber || '')
      setVerificationCode('')
    }
  }, [isPhoneNumberDialogOpen, mfaSettings.sms.phoneNumber])

  const handleSavePhoneNumber = React.useCallback(async () => {
    startSaving()
    try {
      await savePhoneNumber(phoneNumber)
    } finally {
      stopSaving()
    }
  }, [phoneNumber, savePhoneNumber, startSaving, stopSaving])

  const handleVerifyPhoneNumber = React.useCallback(async () => {
    startSaving()
    try {
      await verifyPhoneNumber(verificationCode)
    } finally {
      stopSaving()
    }
  }, [verificationCode, verifyPhoneNumber, startSaving, stopSaving])

  const handleSubmit = React.useCallback(
    (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (isSaving) {
        return
      }

      if (isPhoneVerificationRequired) {
        if (!verificationCode) {
          return
        }

        void handleVerifyPhoneNumber()
        return
      }

      if (!phoneNumber) {
        return
      }

      void handleSavePhoneNumber()
    },
    [
      handleSavePhoneNumber,
      handleVerifyPhoneNumber,
      isPhoneVerificationRequired,
      isSaving,
      phoneNumber,
      verificationCode,
    ],
  )

  const handleResendVerificationCode = React.useCallback(async () => {
    startResending()
    try {
      await resendPhoneNumberVerificationCode()
    } finally {
      stopResending()
    }
  }, [resendPhoneNumberVerificationCode, startResending, stopResending])

  return (
    <Dialog
      open={isPhoneNumberDialogOpen}
      onClose={() => {
        if (!isSaving) {
          closePhoneNumberDialog()
        }
      }}
      fullWidth
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isPhoneVerificationRequired
            ? 'Verify Phone Number'
            : 'Save Phone Number'}
        </DialogTitle>
        <DialogContent dividers>
          {isPhoneVerificationRequired ? (
            <>
              <Typography variant="body2" paragraph>
                Enter the verification code sent to {phoneNumber}.
              </Typography>
              <InputField
                key="verification-code"
                autoFocus
                margin="none"
                name="verificationCode"
                label="Verification Code"
                fullWidth
                placeholder="XXXXXX"
                variant="outlined"
                value={verificationCode}
                onChange={(event) => {
                  setVerificationCode(event.target.value)
                }}
                disabled={isSaving}
                data-cypress="mfa-phone-verification-code"
              />
              <Box marginTop={1}>
                <Button
                  type="button"
                  variant="text"
                  size="small"
                  disabled={
                    resendCoolDownSeconds > 0 || isSaving || isResending
                  }
                  onClick={handleResendVerificationCode}
                  data-cypress="mfa-phone-resend-button"
                >
                  {resendCoolDownSeconds > 0
                    ? `Send again (${resendCoolDownSeconds}s)`
                    : 'Send again'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="body2" paragraph>
                Enter your phone number to receive SMS verification codes when
                signing in.
              </Typography>
              <InputField
                key="phone-number"
                autoFocus
                margin="none"
                name="phoneNumber"
                label="Phone Number"
                fullWidth
                placeholder="+61400000000"
                variant="outlined"
                value={phoneNumber}
                onChange={(event) => {
                  setPhoneNumber(event.target.value)
                }}
                disabled={isSaving}
                helperText="Include your country code, for example +61400000000."
                data-cypress="mfa-phone-number"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            type="button"
            onClick={closePhoneNumberDialog}
            disabled={isSaving}
          >
            Cancel
          </Button>
          {isPhoneVerificationRequired ? (
            <Button
              type="submit"
              variant="contained"
              disabled={!verificationCode || isSaving}
              data-cypress="mfa-phone-verify-button"
            >
              Verify
            </Button>
          ) : (
            <Button
              type="submit"
              variant="contained"
              disabled={!phoneNumber || isSaving}
              data-cypress="mfa-phone-save-button"
            >
              Save
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  )
}

/**
 * React Component that lets users enter and verify a phone number for SMS MFA.
 * Typically rendered by `<MultiFactorAuthentication />` within an `<MfaProvider
 * />` tree.
 *
 * @returns
 */
export default React.memo(MfaPhoneNumberDialog)
