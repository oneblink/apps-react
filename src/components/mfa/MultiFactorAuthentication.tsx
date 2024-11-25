import * as React from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Icon,
  Paper,
  Tooltip,
  Typography,
  styled,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import ConfirmDialog from '../ConfirmDialog'
import MfaDialog from './MfaDialog'
import ErrorSnackbar from '../ErrorSnackbar'
import MaterialIcon from '../MaterialIcon'
import useMfa from '../../hooks/useMfa'
import ErrorMessage from '../messages/ErrorMessage'

export const LargeIcon = styled(Icon)(({ theme }) => ({
  fontSize: `${theme.typography.h4.fontSize} !important`,
}))

type Props = {
  ssoSetupUrl?: string
}

type MfaStatusProps = {
  isExternalIdentityProviderUser: boolean
  isLoading: boolean
  isMfaEnabled: boolean
  loadMfa: () => void
  loadingError?: Error
}

function MfaStatus({
  isExternalIdentityProviderUser,
  isLoading,
  loadingError,
  loadMfa,
  isMfaEnabled,
}: MfaStatusProps) {
  if (isExternalIdentityProviderUser) return null

  if (isLoading) {
    return (
      <Box padding={3}>
        <Grid container justifyContent="center">
          <CircularProgress />
        </Grid>
      </Box>
    )
  }

  if (loadingError) {
    return (
      <div>
        <ErrorMessage
          title="Error Loading Multi Factor Authentication Configuration"
          onTryAgain={loadMfa}
        >
          {loadingError.message}
        </ErrorMessage>
      </div>
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

function MfaSetup({ ssoSetupUrl }: { ssoSetupUrl: string }) {
  const {
    setupError,
    isMfaEnabled,
    isDisablingMfa,
    isSettingUpMfa,
    mfaSetup,
    beginMfaSetup,
    cancelMfaSetup,
    completeMfaSetup,
    clearMfaSetupError,
    beginDisablingMfa,
    completeDisablingMfa,
    cancelDisablingMfa,
    isExternalIdentityProviderUser,
  } = useMfa()

  if (ssoSetupUrl) {
    return (
      <Grid item>
        <Button
          variant="outlined"
          size="small"
          component="a"
          href={ssoSetupUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-cypress="configure-mfa-button"
        >
          Configure MFA
        </Button>
      </Grid>
    )
  }

  if (isExternalIdentityProviderUser) {
    return (
      <Grid item>
        <Tooltip title="MFA must be configured in your login provider.">
          <span>
            <Button
              variant="outlined"
              size="small"
              disabled={isExternalIdentityProviderUser}
              data-cypress="configure-mfa-button"
            >
              Configure MFA
            </Button>
          </span>
        </Tooltip>
      </Grid>
    )
  }

  return (
    <>
      <Grid item>
        <Button
          variant="outlined"
          size="small"
          disabled={!isMfaEnabled}
          data-cypress="disable-mfa-button"
          onClick={beginDisablingMfa}
        >
          Disable MFA
        </Button>
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
      </Grid>

      <Grid item>
        <LoadingButton
          variant="contained"
          size="small"
          loading={isSettingUpMfa}
          disabled={isMfaEnabled}
          onClick={beginMfaSetup}
          data-cypress="setup-mfa-button"
        >
          Setup MFA
        </LoadingButton>
        <MfaDialog
          mfaSetup={mfaSetup}
          onClose={cancelMfaSetup}
          onCompleted={completeMfaSetup}
        />
      </Grid>
      <ErrorSnackbar open={!!setupError} onClose={clearMfaSetupError}>
        <span data-cypress="mfa-setup-error-message">
          {setupError?.message}
        </span>
      </ErrorSnackbar>
    </>
  )
}
/**
 * React Component that provides a mechanism for app users to configure Multi
 * Factor Authentication. `<MfaProvider />` must be provided above this
 * component in the component tree.
 *
 * #### Example
 *
 * ```js
 * import * as React from 'react'
 * import {
 *   MfaProvider,
 *   MultiFactorAuthentication,
 * } from '@oneblink/apps-react'
 *
 * function Component() {
 *   return <MultiFactorAuthentication />
 * }
 *
 * function App() {
 *   return (
 *     <MfaProvider>
 *       <Component />
 *     </MfaProvider>
 *   )
 * }
 *
 * const root = document.getElementById('root')
 * if (root) {
 *   ReactDOM.render(<App />, root)
 * }
 * ```
 *
 * @param props
 * @returns
 * @group Components
 */
export default function MultiFactorAuthentication({ ssoSetupUrl }: Props) {
  const {
    loadingError,
    isLoading,
    isMfaEnabled,
    loadMfa,
    isExternalIdentityProviderUser,
  } = useMfa()

  return (
    <Grid item xs={true} lg={8}>
      <Box padding={3}>
        <Paper>
          <Box padding={3}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <Typography variant="h4" fontWeight="light">
                  Multi Factor Authentication{' '}
                  <MfaStatus
                    loadMfa={loadMfa}
                    isLoading={isLoading}
                    loadingError={loadingError}
                    isMfaEnabled={isMfaEnabled}
                    isExternalIdentityProviderUser={
                      !!isExternalIdentityProviderUser
                    }
                  />
                </Typography>
                <Box marginY={1}>
                  <Divider />
                </Box>
                <Typography variant="body2" paragraph>
                  Multi factor authentication (MFA), also known as two factor
                  authentication (2FA), is a best practice that requires a
                  second authentication factor in addition to user name and
                  password sign-in credentials. We strongly recommend enabling
                  MFA to enhance your account security.
                </Typography>
                <Grid container justifyContent="flex-end" spacing={1}>
                  <MfaSetup ssoSetupUrl={ssoSetupUrl || ''} />
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Grid>
  )
}
