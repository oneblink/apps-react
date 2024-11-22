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
} from '@mui/material'
import { authService } from '@oneblink/apps'
import useBooleanState from '../../hooks/useBooleanState'
import { CopyToClipBoardIconButton } from '../CopyToClipboardIconButton'
import SuccessSnackbar from '../SuccessSnackbar'
import InputField from '../InputField'
import { LoadingButton } from '@mui/lab'

function MfaDialog({
  onClose,
  onCompleted,
  mfaSetup,
}: {
  onClose: () => void
  onCompleted: () => void
  mfaSetup: Awaited<ReturnType<typeof authService.setupMfa>> | undefined
}) {
  const [code, setState] = React.useState('')
  const [hasSuccessfullySaved, showSuccessfullySaved, hideSuccessfullySaved] =
    useBooleanState(false)
  const [isShowingSecretCode, showSecretCode, hideSecretCode] =
    useBooleanState(false)

  const qrcodeValue = React.useMemo(() => {
    if (mfaSetup) {
      return authService.generateMfaQrCodeUrl(mfaSetup)
    }
  }, [mfaSetup])

  const [isSaving, startSaving, stopSaving] = useBooleanState(false)
  const handleSave = React.useCallback(async () => {
    startSaving()
    if (!code || !mfaSetup) {
      return
    }

    await mfaSetup.mfaCodeCallback(code)
    onCompleted()
    stopSaving()
    showSuccessfullySaved()
  }, [
    code,
    mfaSetup,
    onCompleted,
    showSuccessfullySaved,
    startSaving,
    stopSaving,
  ])

  return (
    <React.Fragment>
      <Dialog open={!!mfaSetup} onClose={onClose} title="Complete MFA Setup">
        <DialogContent dividers>
          <>
            <Typography variant="subtitle2" gutterBottom>
              Authenticator App
            </Typography>
            <Typography variant="body2" paragraph>
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
            <Typography variant="body2" paragraph>
              Use an authenticator app or browser extension to scan the QR code
              below.
            </Typography>

            <Box marginBottom={2}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={false}>
                  <Box
                    border={1}
                    padding={2}
                    borderRadius={1}
                    borderColor="divider"
                    display="inline-block"
                  >
                    <QRCodeSVG value={qrcodeValue || ''} />
                  </Box>
                </Grid>
                <Grid item xs>
                  <Typography variant="caption" color="text.secondary">
                    Having trouble scanning the QR code?{' '}
                    <Link onClick={showSecretCode} component="button">
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
                  value={mfaSetup?.secretCode || ''}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <CopyToClipBoardIconButton
                        text={mfaSetup?.secretCode || ''}
                      />
                    ),
                  }}
                  helperText={
                    <>
                      <Link onClick={hideSecretCode} component="button">
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
            <Typography variant="body2" paragraph>
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
              data-cypress="mfa-dialog-code"
            />
          </>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color="primary"
            loading={isSaving}
            onClick={handleSave}
          >
            Save
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <SuccessSnackbar
        open={hasSuccessfullySaved}
        onClose={hideSuccessfullySaved}
      >
        MFA has been successfully setup.
      </SuccessSnackbar>
    </React.Fragment>
  )
}

export default React.memo(MfaDialog)
