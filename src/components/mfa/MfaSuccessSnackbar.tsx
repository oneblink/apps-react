import { memo } from 'react'
import useMfa from '../../hooks/useMfa'
import SuccessSnackbar from '../SuccessSnackbar'

function MfaSuccessSnackbar() {
  const { isSetupSuccessOpen, hideSetupSuccess } = useMfa()

  return (
    <SuccessSnackbar open={isSetupSuccessOpen} onClose={hideSetupSuccess}>
      MFA has been successfully setup.
    </SuccessSnackbar>
  )
}

/**
 * React Component that displays a success snackbar when MFA setup completes.
 * Typically rendered by `<MultiFactorAuthentication />` within an `<MfaProvider
 * />` tree.
 *
 * @returns
 */
export default memo(MfaSuccessSnackbar)
