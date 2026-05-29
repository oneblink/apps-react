import { memo } from 'react'
import { Typography } from '@mui/material'
import ConfirmDialog from '../ConfirmDialog'
import MaterialIcon from '../MaterialIcon'
import useMfa from '../../hooks/useMfa'

function MfaDisableDialog() {
  const { isDisablingMfa, completeDisablingMfa, cancelDisablingMfa } = useMfa()

  return (
    <ConfirmDialog
      isOpen={isDisablingMfa}
      onClose={cancelDisablingMfa}
      onConfirm={completeDisablingMfa}
      title="Please Confirm"
      confirmButtonText="Disable MFA"
      confirmButtonIcon={<MaterialIcon>remove_moderator</MaterialIcon>}
      cypress={{
        dialog: 'disable-mfa-dialog',
        confirmButton: 'disable-mfa-dialog-confirm-button',
        cancelButton: 'disable-mfa-dialog-cancel-button',
        error: 'disable-mfa-dialog-error-message',
      }}
    >
      <Typography variant="body2">
        Are you sure want to disable multi factor authentication (MFA)?
      </Typography>
    </ConfirmDialog>
  )
}

/**
 * React Component that prompts the user to confirm disabling MFA. Typically
 * rendered by `<MultiFactorAuthentication />` within an `<MfaProvider />`
 * tree.
 *
 * @returns
 */
export default memo(MfaDisableDialog)
