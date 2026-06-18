import { memo } from 'react'
import { Typography } from '@mui/material'
import ConfirmDialog from '../ConfirmDialog'
import MaterialIcon from '../MaterialIcon'
import useMfa from '../../hooks/useMfa'

function MfaRemovePhoneNumberDialog() {
  const {
    isRemovePhoneNumberDialogOpen,
    mfaSettings,
    completeRemovingPhoneNumber,
    cancelRemovingPhoneNumber,
  } = useMfa()

  return (
    <ConfirmDialog
      isOpen={isRemovePhoneNumberDialogOpen}
      onClose={cancelRemovingPhoneNumber}
      onConfirm={completeRemovingPhoneNumber}
      title="Please Confirm"
      confirmButtonText="Remove Phone Number"
      confirmButtonIcon={<MaterialIcon>phone_disabled</MaterialIcon>}
      cypress={{
        dialog: 'remove-phone-number-dialog',
        confirmButton: 'remove-phone-number-dialog-confirm-button',
        cancelButton: 'remove-phone-number-dialog-cancel-button',
        error: 'remove-phone-number-dialog-error-message',
      }}
    >
      <Typography variant="body2">
        Are you sure you want to remove {mfaSettings?.phoneNumber} from your
        account?
      </Typography>
    </ConfirmDialog>
  )
}

/**
 * React Component that prompts the user to confirm removing their phone number.
 * Typically rendered by `<MultiFactorAuthentication />` within an `<MfaProvider
 * />` tree.
 *
 * @returns
 */
export default memo(MfaRemovePhoneNumberDialog)
