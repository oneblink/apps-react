import { useMemo } from 'react'
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material'
import MfaAuthenticatorAppDialog from './MfaAuthenticatorAppDialog'
import useMfa from '../../hooks/useMfa'
import MfaDisableDialog from './MfaDisableDialog'
import MfaRemovePhoneNumberDialog from './MfaRemovePhoneNumberDialog'
import MfaPhoneNumberDialog from './MfaPhoneNumberDialog'
import MfaMethodRow from './MfaMethodRow'
import MfaSuccessSnackbar from './MfaSuccessSnackbar'
import MfaErrorSnackbar from './MfaErrorSnackbar'
import MfaStatusChip from './MfaStatusChip'

type Props = {
  ssoSetupUrl: string | undefined
}

function MfaMethodList() {
  const {
    mfaSettings,
    loadingError,
    isLoading,
    isSettingUpMfa,
    settingUpMfaMethod,
    isSettingPreferredMfaMethod,
    beginMfaSetup,
    beginDisablingMfaMethod,
    setPreferredMfaMethod,
    beginRemovingPhoneNumber,
  } = useMfa()

  const phoneDetail = useMemo(() => {
    if (!mfaSettings.sms.phoneNumber) {
      return undefined
    }

    if (!mfaSettings.sms.isPhoneNumberVerified) {
      return `Phone number: ${mfaSettings.sms.phoneNumber} (not verified)`
    }

    return `Phone number: ${mfaSettings.sms.phoneNumber}`
  }, [mfaSettings])

  if (isLoading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading MFA methods...
      </Typography>
    )
  }

  if (loadingError) {
    return (
      <Typography variant="body2" color="error">
        We are unable to load your MFA methods. Please try again by clicking the
        reload button on the chip above.
      </Typography>
    )
  }

  return (
    <>
      <MfaMethodRow
        isEnabled={mfaSettings.authenticator.enabled}
        isPreferred={mfaSettings.authenticator.preferred}
        isSettingUp={
          isSettingUpMfa && settingUpMfaMethod === 'authenticator'
        }
        isSettingPreferredMfaMethod={isSettingPreferredMfaMethod}
        isSetupDisabled={!!loadingError || isSettingUpMfa}
        showSetupErrorTooltip={!!loadingError}
        title="Authenticator App"
        description="Use an app like Google Authenticator or Microsoft Authenticator to generate 6-digit verification codes."
        cypressPrefix="mfa-authenticator"
        onSetup={() => beginMfaSetup('authenticator')}
        onDisable={() => beginDisablingMfaMethod('authenticator')}
        onSetPreferred={() => setPreferredMfaMethod('authenticator')}
      />
      <Divider sx={{ my: 2 }} />
      <MfaMethodRow
        isEnabled={mfaSettings.sms.enabled}
        isPreferred={mfaSettings.sms.preferred}
        isSettingUp={isSettingUpMfa && settingUpMfaMethod === 'sms'}
        isSettingPreferredMfaMethod={isSettingPreferredMfaMethod}
        isSetupDisabled={!!loadingError || isSettingUpMfa}
        showSetupErrorTooltip={!!loadingError}
        title="SMS"
        description="Receive a one-time verification code via SMS each time MFA is required."
        detail={phoneDetail}
        cypressPrefix="mfa-sms"
        onSetup={() => beginMfaSetup('sms')}
        onDisable={() => beginDisablingMfaMethod('sms')}
        onSetPreferred={() => setPreferredMfaMethod('sms')}
        extraButtons={
          !!mfaSettings.sms.phoneNumber && !mfaSettings.sms.enabled ? (
            <Button
              size="small"
              variant="outlined"
              disabled={!!loadingError}
              onClick={beginRemovingPhoneNumber}
              data-cypress="mfa-sms-remove-phone-button"
            >
              Remove Phone
            </Button>
          ) : undefined
        }
      />
    </>
  )
}

function MfaSetup({ ssoSetupUrl }: Props) {
  const { isExternalIdentityProviderUser } = useMfa()

  if (ssoSetupUrl) {
    return (
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
    )
  }

  if (isExternalIdentityProviderUser) {
    return (
      <Tooltip title="MFA must be configured in your login provider.">
        <span>
          <Button
            variant="outlined"
            disabled={isExternalIdentityProviderUser}
            data-cypress="configure-mfa-button"
          >
            Configure MFA
          </Button>
        </span>
      </Tooltip>
    )
  }

  return (
    <>
      <MfaMethodList />
      <MfaDisableDialog />
      <MfaRemovePhoneNumberDialog />
      <MfaPhoneNumberDialog />
      <MfaAuthenticatorAppDialog />
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
                <MfaSetup ssoSetupUrl={ssoSetupUrl} />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Grid>
  )
}
