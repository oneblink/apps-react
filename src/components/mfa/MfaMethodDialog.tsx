import { memo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  DialogActions,
  Button,
} from '@mui/material'
import useMfa from '../../hooks/useMfa'

function MfaMethodDialog() {
  const {
    isSettingUpMfa,
    isSetupMethodDialogOpen,
    beginMfaSetup,
    closeMfaSetupMethodDialog,
  } = useMfa()

  return (
    <>
      <Dialog
        open={isSetupMethodDialogOpen}
        onClose={() => {
          if (!isSettingUpMfa) {
            closeMfaSetupMethodDialog()
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Choose MFA Method</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" paragraph>
            Choose how you want to receive MFA codes when you sign in.
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Authenticator App
          </Typography>
          <Typography variant="body2" paragraph>
            Use an app like Google Authenticator or Microsoft Authenticator to
            generate 6-digit verification codes.
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Email
          </Typography>
          <Typography variant="body2">
            Receive a one-time verification code at your email address each time
            MFA is required.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMfaSetupMethodDialog} disabled={isSettingUpMfa}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={() => beginMfaSetup('email')}
            loading={isSettingUpMfa}
          >
            Use Email
          </Button>
          <Button
            variant="contained"
            onClick={() => beginMfaSetup('authenticator')}
            loading={isSettingUpMfa}
          >
            Use Authenticator App
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

/**
 * React Component that lets users choose an MFA method (authenticator app or
 * email) when setting up multi factor authentication. Typically rendered by
 * `<MultiFactorAuthentication />` within an `<MfaProvider />` tree.
 *
 * @returns
 */
export default memo(MfaMethodDialog)
