import { memo } from 'react'
import { Chip, CircularProgress, Tooltip } from '@mui/material'
import MaterialIcon from '../MaterialIcon'
import useMfa from '../../hooks/useMfa'

/**
 * React Component that displays a status chip for the user's MFA status.
 * Typically rendered by `<MultiFactorAuthentication />` within an `<MfaProvider
 * />` tree.
 *
 * @returns
 */
function MfaStatusChip() {
  const {
    loadingError,
    isLoading,
    isMfaEnabled,
    loadMfa,
    isExternalIdentityProviderUser,
  } = useMfa()

  if (isExternalIdentityProviderUser) return null

  if (isLoading) {
    return (
      <Chip
        label="Loading MFA Status..."
        icon={<CircularProgress size={16} />}
      />
    )
  }

  if (loadingError) {
    return (
      <Tooltip title={loadingError.message}>
        <Chip
          label="MFA Loading Error"
          icon={<MaterialIcon color="error">error</MaterialIcon>}
          deleteIcon={<MaterialIcon color="error">refresh</MaterialIcon>}
          onDelete={loadMfa}
        />
      </Tooltip>
    )
  }

  if (isMfaEnabled) {
    return (
      <Chip
        label="Enabled"
        icon={<MaterialIcon color="success">verified_user</MaterialIcon>}
      />
    )
  }

  return (
    <Chip
      label="Disabled"
      icon={<MaterialIcon color="warning">remove_moderator</MaterialIcon>}
    />
  )
}

export default memo(MfaStatusChip)
