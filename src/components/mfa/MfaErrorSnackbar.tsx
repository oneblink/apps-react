import { memo } from 'react'
import useMfa from '../../hooks/useMfa'
import ErrorSnackbar from '../ErrorSnackbar'

function MfaErrorSnackbar() {
  const { setupError, clearMfaSetupError } = useMfa()

  return (
    <ErrorSnackbar open={!!setupError} onClose={clearMfaSetupError}>
      <span data-cypress="mfa-setup-error-message">{setupError?.message}</span>
    </ErrorSnackbar>
  )
}

/**
 * React Component that displays MFA setup errors from the `useMfa()` hook.
 * Typically rendered by `<MultiFactorAuthentication />` within an `<MfaProvider
 * />` tree.
 *
 * @returns
 */
export default memo(MfaErrorSnackbar)
