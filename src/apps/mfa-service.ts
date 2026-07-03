import { MiscTypes } from '@oneblink/types'
import { getMfaSettings } from './services/cognito'
import { userMeetsMfaRequirement } from '../utils/mfa-requirement'

export { getMfaSettings }
export {
  updateUserPhoneNumber,
  removeUserPhoneNumber,
  verifyUserPhoneNumber,
  disableMfaMethod,
  setPreferredMfaMethod,
  setupMfaAuthenticatorApp,
  setupSmsMfa,
  generateMfaAuthenticatorAppQrCodeUrl,
  DEFAULT_MFA_SETTINGS,
} from './services/cognito'
export type { MfaMethod, MfaSettings, LoggedInMfaMethod } from './services/cognito'
export {
  isMfaRequired,
  mfaRequirementToSelectedMethods,
  mfaSelectedMethodsToMfaRequirement,
  formatMfaRequirementLabel,
  userMeetsMfaRequirement,
  formatMfaSetupRequiredMessage,
  formatMfaMethodRequirementMessage,
  isMfaMethodUsedForLogin,
} from '../utils/mfa-requirement'
export type { MfaRequirementMethod } from '../utils/mfa-requirement'

export type MfaRequirementCheckResult = {
  mfaSettings: Awaited<ReturnType<typeof getMfaSettings>>
  userMeetsMfaRequirement: boolean
}

/**
 * Check if the current user meets an MFA requirement.
 *
 * #### Example
 *
 * ```js
 * const { mfaSettings, userMeetsMfaRequirement } =
 *   await mfaService.checkIsMfaEnabled('any')
 * if (userMeetsMfaRequirement) {
 *   // User has met the MFA requirement
 * } else {
 *   // Prompt user to set up MFA
 * }
 * ```
 *
 * @returns
 */
export async function checkIsMfaEnabled(
  mfaRequirement: MiscTypes.MfaRequirement | undefined,
): Promise<MfaRequirementCheckResult> {
  const mfaSettings = await getMfaSettings()

  return {
    mfaSettings,
    userMeetsMfaRequirement: userMeetsMfaRequirement(
      mfaRequirement,
      mfaSettings,
    ),
  }
}
