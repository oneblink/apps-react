import * as React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Box,
  Collapse,
  Dialog,
  Grid,
  Link,
  Typography,
  DialogContent,
  DialogActions,
  Button,
  DialogTitle,
} from '@mui/material'
import { mfaService } from '../../apps'
import useBooleanState from '../../hooks/useBooleanState'
import useMfa from '../../hooks/useMfa'
import { CopyToClipBoardIconButton } from '../CopyToClipboardIconButton'
import InputField from '../InputField'

function MfaAuthenticatorAppDialog() {
  const {
    mfaAuthenticatorAppSetup,
    cancelMfaAuthenticatorAppSetup,
    completeMfaAuthenticatorAppSetup,
  } = useMfa()

  const [code, setState] = React.useState('')
  const [isShowingSecretCode, showSecretCode, hideSecretCode] =
    useBooleanState(false)

  const qrcodeValue = React.useMemo(() => {
    if (mfaAuthenticatorAppSetup) {
      return mfaService.generateMfaAuthenticatorAppQrCodeUrl(
        mfaAuthenticatorAppSetup,
      )
    }
  }, [mfaAuthenticatorAppSetup])

  const [isSaving, startSaving, stopSaving] = useBooleanState(false)
  const handleSubmit = React.useCallback(
    async (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!code || !mfaAuthenticatorAppSetup || isSaving) {
        return
      }

      startSaving()
      try {
        await mfaAuthenticatorAppSetup.mfaCodeCallback(code)
        await completeMfaAuthenticatorAppSetup()
      } finally {
        stopSaving()
      }
    },
    [
      code,
      completeMfaAuthenticatorAppSetup,
      isSaving,
      mfaAuthenticatorAppSetup,
      startSaving,
      stopSaving,
    ],
  )

  return (
    <React.Fragment>
      <Dialog
        open={!!mfaAuthenticatorAppSetup}
        onClose={cancelMfaAuthenticatorAppSetup}
        title="Complete MFA Setup"
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>Authenticator App Setup</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" component="p" sx={{ mb: 2 }}>
              Authenticator apps like{' '}
              <Link
                href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Authenticator
              </Link>{' '}
              and{' '}
              <Link
                href="https://www.microsoft.com/en-us/security/mobile-authenticator-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Microsoft Authenticator
              </Link>{' '}
              generate one-time passwords that are used as a second factor to
              verify your identity when prompted during sign-in.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Scan the QR code
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Use an authenticator app or browser extension to scan the QR code
              below.
            </Typography>

            <Box marginBottom={2}>
              <Grid container spacing={2} alignItems="center">
                <Grid>
                  <Box
                    border={1}
                    padding={2}
                    borderRadius={1}
                    borderColor="divider"
                    display="inline-block"
                    lineHeight={0}
                  >
                    <QRCodeSVG value={qrcodeValue || ''} />
                  </Box>
                </Grid>
                <Grid size={{ xs: 'grow' }}>
                  <Typography variant="caption" color="text.secondary">
                    Having trouble scanning the QR code?{' '}
                    <Link
                      type="button"
                      onClick={showSecretCode}
                      component="button"
                    >
                      Click here
                    </Link>{' '}
                    to display the setup key which can be manually entered in
                    your authenticator app.
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Collapse in={isShowingSecretCode}>
              <Box marginBottom={2}>
                <InputField
                  label="Setup Key"
                  value={mfaAuthenticatorAppSetup?.secretCode || ''}
                  variant="filled"
                  focused={false}
                  sx={{
                    input: {
                      cursor: 'default !important',
                    },
                  }}
                  fullWidth
                  slotProps={{
                    input: {
                      readOnly: true,
                      endAdornment: (
                        <CopyToClipBoardIconButton
                          text={mfaAuthenticatorAppSetup?.secretCode || ''}
                        />
                      ),
                    },
                  }}
                  helperText={
                    <>
                      <Link
                        type="button"
                        onClick={hideSecretCode}
                        component="button"
                      >
                        Click here
                      </Link>{' '}
                      to hide the setup key
                    </>
                  }
                />
              </Box>
            </Collapse>

            <Typography variant="subtitle2" gutterBottom>
              Verify App
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Enter the 6-digit code found in your authenticator app.
            </Typography>

            <InputField
              autoFocus
              margin="none"
              name="code"
              label="Code"
              fullWidth
              placeholder="XXXXXX"
              variant="outlined"
              value={code}
              onChange={(event) => {
                const newValue = event.target.value
                setState(() => newValue)
              }}
              disabled={isSaving}
              data-cypress="mfa-authenticator-app-code"
            />
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={cancelMfaAuthenticatorAppSetup}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!code || isSaving}
            >
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </React.Fragment>
  )
}

/**
 * React Component that guides users through authenticator app MFA setup,
 * including QR code scanning and verification code entry. Typically rendered by
 * `<MultiFactorAuthentication />` within an
 * `<MfaProvider />` tree.
 *
 * @returns
 */
export default React.memo(MfaAuthenticatorAppDialog)
