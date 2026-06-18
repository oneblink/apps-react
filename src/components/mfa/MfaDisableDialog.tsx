import { memo } from 'react'
import { Typography } from '@mui/material'
import ConfirmDialog from '../ConfirmDialog'
import MaterialIcon from '../MaterialIcon'
import useMfa from '../../hooks/useMfa'

const methodLabels = {
  authenticator: 'Authenticator App',
  sms: 'SMS',
} as const

function MfaDisableDialog() {
  const {
    disablingMfaMethod,
    completeDisablingMfa,
    cancelDisablingMfa,
  } = useMfa()

  const methodLabel = disablingMfaMethod
    ? methodLabels[disablingMfaMethod]
    : 'MFA'

  return (
    <ConfirmDialog
      isOpen={!!disablingMfaMethod}
      onClose={cancelDisablingMfa}
      onConfirm={completeDisablingMfa}
      title="Please Confirm"
      confirmButtonText={`Disable ${methodLabel}`}
      confirmButtonIcon={<MaterialIcon>remove_moderator</MaterialIcon>}
      cypress={{
        dialog: 'disable-mfa-dialog',
        confirmButton: 'disable-mfa-dialog-confirm-button',
        cancelButton: 'disable-mfa-dialog-cancel-button',
        error: 'disable-mfa-dialog-error-message',
      }}
    >
      <Typography variant="body2">
        Are you sure you want to disable {methodLabel} multi factor
        authentication (MFA)?
      </Typography>
    </ConfirmDialog>
  )
}

/**
 * React Component that prompts the user to confirm disabling an MFA method.
 * Typically rendered by `<MultiFactorAuthentication />` within an `<MfaProvider
 * />` tree.
 *
 * @returns
 */
export default memo(MfaDisableDialog)
