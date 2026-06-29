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
import { MiscTypes } from '@oneblink/types'
import MfaAuthenticatorAppDialog from './MfaAuthenticatorAppDialog'
import useMfa from '../../hooks/useMfa'
import MfaDisableDialog from './MfaDisableDialog'
import MfaRemovePhoneNumberDialog from './MfaRemovePhoneNumberDialog'
import MfaPhoneNumberDialog from './MfaPhoneNumberDialog'
import MfaMethodRow from './MfaMethodRow'
import MfaSuccessSnackbar from './MfaSuccessSnackbar'
import MfaErrorSnackbar from './MfaErrorSnackbar'
import MfaStatusChip from './MfaStatusChip'
import { formatMfaMethodNotAcceptedMessage } from '../../utils/mfa-requirement'

type Props = {
  /**
   * The MFA methods allowed by your administrator for using this app. Pass
   * `undefined` when the app has no MFA requirement. Users can still enable
   * other methods, but will be warned when their configuration does not meet
   * this requirement.
   */
  mfaRequirement: MiscTypes.MfaRequirement | undefined
  /**
   * When provided, renders a link to configure MFA externally instead of the
   * inline MFA method list.
   */
  ssoSetupUrl?: string
  /**
   * When `true`, SMS setup is disabled and a message is shown indicating it
   * will be available soon. Defaults to `false`.
   */
  isSMSUnavailable?: boolean
}

function MfaMethodList({
  mfaRequirement,
  isSMSUnavailable = false,
}: Pick<Props, 'mfaRequirement' | 'isSMSUnavailable'>) {
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

  const authenticatorMfaRequirementMessage = useMemo(() => {
    return formatMfaMethodNotAcceptedMessage('authenticatorApp', mfaRequirement)
  }, [mfaRequirement])

  const smsMfaRequirementMessage = useMemo(() => {
    return formatMfaMethodNotAcceptedMessage('sms', mfaRequirement)
  }, [mfaRequirement])

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

  const smsUnavailableMessage = isSMSUnavailable
    ? 'SMS authentication will be available soon.'
    : undefined

  return (
    <>
      <MfaMethodRow
        isEnabled={mfaSettings.authenticator.enabled}
        isPreferred={mfaSettings.authenticator.preferred}
        isSettingUp={isSettingUpMfa && settingUpMfaMethod === 'authenticator'}
        isSettingPreferredMfaMethod={isSettingPreferredMfaMethod}
        isSetupDisabled={!!loadingError || isSettingUpMfa}
        showSetupErrorTooltip={!!loadingError}
        title="Authenticator App"
        description="Use an app like Google Authenticator or Microsoft Authenticator to generate 6-digit verification codes."
        mfaRequirementMessage={authenticatorMfaRequirementMessage}
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
        isSetupDisabled={!!loadingError || isSettingUpMfa || isSMSUnavailable}
        showSetupErrorTooltip={!!loadingError}
        title="SMS"
        description="Receive a one-time verification code via SMS each time MFA is required."
        detail={phoneDetail}
        unavailableMessage={smsUnavailableMessage}
        mfaRequirementMessage={smsMfaRequirementMessage}
        cypressPrefix="mfa-sms"
        onSetup={() => beginMfaSetup('sms')}
        onDisable={() => beginDisablingMfaMethod('sms')}
        onSetPreferred={() => setPreferredMfaMethod('sms')}
        extraButtons={
          !!mfaSettings.sms.phoneNumber && !mfaSettings.sms.enabled ? (
            <Button
              size="small"
              variant="outlined"
              disabled={!!loadingError || isSMSUnavailable}
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

function MfaSetup({ ssoSetupUrl, mfaRequirement, isSMSUnavailable }: Props) {
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
      <MfaMethodList
        mfaRequirement={mfaRequirement}
        isSMSUnavailable={isSMSUnavailable}
      />
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
 *   return <MultiFactorAuthentication mfaRequirement={undefined} />
 * }
 *
 * function AppWithMfaRequirement({ mfaRequirement }) {
 *   return (
 *     <MfaProvider>
 *       <MultiFactorAuthentication mfaRequirement={mfaRequirement} />
 *     </MfaProvider>
 *   )
 * }
 * ```
 *
 * @param props
 * @param props.mfaRequirement - The MFA methods allowed by your administrator
 *   for using this app. Pass `undefined` when the app has no MFA requirement.
 *   Users can still enable other methods, but will be warned when their
 *   configuration does not meet this requirement.
 * @param props.ssoSetupUrl - When provided, renders a link to configure MFA
 *   externally instead of the inline MFA method list.
 * @param props.isSMSUnavailable - When `true`, SMS setup is disabled and a
 *   message is shown indicating it will be available soon. Defaults to
 *   `false`.
 * @returns
 * @group Components
 */
export default function MultiFactorAuthentication({
  mfaRequirement,
  ssoSetupUrl,
  isSMSUnavailable,
}: Props) {
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
                <MfaSetup
                  ssoSetupUrl={ssoSetupUrl}
                  mfaRequirement={mfaRequirement}
                  isSMSUnavailable={isSMSUnavailable}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Grid>
  )
}
