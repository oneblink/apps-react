import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material'
import MfaDialog from './MfaDialog'
import useMfa from '../../hooks/useMfa'
import MfaDisableDialog from './MfaDisableDialog'
import MfaMethodDialog from './MfaMethodDialog'
import MfaSuccessSnackbar from './MfaSuccessSnackbar'
import MfaErrorSnackbar from './MfaErrorSnackbar'
import MfaStatusChip from './MfaStatusChip'

type Props = {
  ssoSetupUrl: string | undefined
}

function MfaSetup({ ssoSetupUrl }: Props) {
  const {
    isMfaEnabled,
    isSettingUpMfa,
    openMfaSetupMethodDialog,
    beginDisablingMfa,
    isExternalIdentityProviderUser,
    loadingError,
  } = useMfa()

  if (ssoSetupUrl) {
    return (
      <Grid>
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
      <Grid>
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
      <Grid>
        <Button
          variant="outlined"
          size="small"
          disabled={!isMfaEnabled}
          data-cypress="disable-mfa-button"
          onClick={beginDisablingMfa}
        >
          Disable MFA
        </Button>
      </Grid>

      <Grid>
        <Tooltip
          title={
            loadingError
              ? 'We are unable to load your MFA status. Please try again by click the reload button on the chip above.'
              : ''
          }
        >
          <Button
            variant="contained"
            size="small"
            loading={isSettingUpMfa}
            disabled={isMfaEnabled || !!loadingError}
            onClick={openMfaSetupMethodDialog}
            data-cypress="setup-mfa-button"
          >
            Setup MFA
          </Button>
        </Tooltip>
      </Grid>

      <MfaDisableDialog />
      <MfaMethodDialog />
      <MfaDialog />
      <MfaErrorSnackbar />
      <MfaSuccessSnackbar />
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
  return (
    <Grid size={{ xs: 'grow', lg: 8 }}>
      <Box padding={3}>
        <Paper>
          <Box padding={3}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 'grow' }}>
                <Typography variant="h4" fontWeight="light">
                  Multi Factor Authentication <MfaStatusChip />
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
                  <MfaSetup ssoSetupUrl={ssoSetupUrl} />
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Grid>
  )
}
