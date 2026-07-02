import { MiscTypes } from '@oneblink/types'
import type {
  LoggedInMfaMethod,
  MfaSettings,
} from '../apps/services/AWSCognitoClient'
import { joinArray } from './joinArray'

export type { LoggedInMfaMethod, MfaSettings }

export function isMfaRequired(
  mfaRequirement: MiscTypes.MfaRequirement | undefined,
): boolean {
  return (
    !!mfaRequirement && (mfaRequirement.sms || mfaRequirement.authenticatorApp)
  )
}

export type MfaRequirementMethod = keyof MiscTypes.MfaRequirement

const MFA_REQUIREMENT_METHOD_KEYS = Object.keys({
  sms: false,
  authenticatorApp: false,
} satisfies MiscTypes.MfaRequirement) as MfaRequirementMethod[]

export function mfaRequirementToSelectedMethods(
  mfaRequirement: MiscTypes.MfaRequirement | undefined,
): MfaRequirementMethod[] {
  const checkboxState = {
    sms: mfaRequirement?.sms ?? false,
    authenticatorApp: mfaRequirement?.authenticatorApp ?? false,
  }
  const methods: MfaRequirementMethod[] = []

  if (checkboxState.authenticatorApp) {
    methods.push('authenticatorApp')
  }

  if (checkboxState.sms) {
    methods.push('sms')
  }

  return methods
}

export function mfaSelectedMethodsToMfaRequirement(
  methods: MfaRequirementMethod[],
): MiscTypes.MfaRequirement {
  return {
    sms: methods.includes('sms'),
    authenticatorApp: methods.includes('authenticatorApp'),
  }
}

export function formatMfaRequirementLabel(
  mfaRequirement: MiscTypes.MfaRequirement | undefined,
): string {
  if (!isMfaRequired(mfaRequirement)) {
    return 'MFA Optional'
  }

  const selectedMethods = mfaRequirementToSelectedMethods(mfaRequirement)

  if (selectedMethods.length === MFA_REQUIREMENT_METHOD_KEYS.length) {
    return 'MFA Required'
  }

  const methodList = joinArray(
    selectedMethods.map(formatMfaRequirementMethodLabel),
    'disjunction',
  )

  return `MFA Required (${methodList} only)`
}

function formatMfaRequirementMethodLabel(method: MfaRequirementMethod): string {
  switch (method) {
    case 'sms':
      return 'SMS'
    case 'authenticatorApp':
      return 'Authenticator App'
    default: {
      const n: never = method
      return n
    }
  }
}

function mfaRequirementMethodToLoggedInMfaMethod(
  method: MfaRequirementMethod,
): Exclude<LoggedInMfaMethod, 'NO_MFA_ENABLED'> {
  return method === 'sms' ? 'SMS_MFA' : 'SOFTWARE_TOKEN_MFA'
}

export function isMfaMethodUsedForLogin(
  mfaSettings: MfaSettings,
  method: MfaRequirementMethod,
): boolean {
  return (
    mfaSettings.loggedInWithMfaMethod ===
    mfaRequirementMethodToLoggedInMfaMethod(method)
  )
}

export function userMeetsMfaRequirement(
  mfaRequirement: MiscTypes.MfaRequirement | undefined,
  mfaSettings: MfaSettings,
): boolean {
  if (!isMfaRequired(mfaRequirement)) {
    return true
  }

  if (mfaRequirement?.sms && mfaSettings.loggedInWithMfaMethod === 'SMS_MFA') {
    return true
  }

  if (
    mfaRequirement?.authenticatorApp &&
    mfaSettings.loggedInWithMfaMethod === 'SOFTWARE_TOKEN_MFA'
  ) {
    return true
  }

  return false
}

function formatMfaMethodNotAcceptedMessage(
  method: MfaRequirementMethod,
  mfaRequirement: MiscTypes.MfaRequirement | undefined,
  accessScopeLabel = 'app',
): string | undefined {
  if (!mfaRequirement || !isMfaRequired(mfaRequirement)) {
    return undefined
  }

  if (mfaRequirement[method]) {
    return undefined
  }

  const requiredMethods = mfaRequirementToSelectedMethods(mfaRequirement)

  const methodList = joinArray(
    requiredMethods.map(formatMfaRequirementMethodLabel),
    'disjunction',
  )

  return `This MFA method is not sufficient for using this ${accessScopeLabel.toLowerCase()}. Your administrator requires ${methodList} multi factor authentication.`
}

function isMfaMethodEnabled(
  mfaSettings: MfaSettings,
  method: MfaRequirementMethod,
): boolean {
  return method === 'sms'
    ? mfaSettings.sms.enabled
    : mfaSettings.authenticator.enabled
}

function isMfaMethodPreferred(
  mfaSettings: MfaSettings,
  method: MfaRequirementMethod,
): boolean {
  return method === 'sms'
    ? mfaSettings.sms.preferred
    : mfaSettings.authenticator.preferred
}

function hasPreferredEnabledRequiredMethod(
  mfaRequirement: MiscTypes.MfaRequirement,
  mfaSettings: MfaSettings,
): boolean {
  return mfaRequirementToSelectedMethods(mfaRequirement).some(
    (method) =>
      isMfaMethodEnabled(mfaSettings, method) &&
      isMfaMethodPreferred(mfaSettings, method),
  )
}

export function formatMfaSetupRequiredMessage(
  mfaRequirement: MiscTypes.MfaRequirement | undefined,
  mfaSettings: MfaSettings,
  accessScopeLabel = 'Account',
): string | undefined {
  if (
    !mfaRequirement ||
    !isMfaRequired(mfaRequirement) ||
    userMeetsMfaRequirement(mfaRequirement, mfaSettings)
  ) {
    return undefined
  }

  const requiredMethods = mfaRequirementToSelectedMethods(mfaRequirement)

  if (requiredMethods.length === 1) {
    const method = requiredMethods[0]
    const methodLabel = formatMfaRequirementMethodLabel(method)

    if (!isMfaMethodEnabled(mfaSettings, method)) {
      return `requires ${methodLabel} multi factor authentication to be configured before accessing this ${accessScopeLabel}.`
    }

    if (!isMfaMethodPreferred(mfaSettings, method)) {
      return `requires ${methodLabel} multi factor authentication. Please change your preferred MFA method to ${methodLabel} to access this ${accessScopeLabel}.`
    }

    return `requires ${methodLabel} multi factor authentication. Now that ${methodLabel} is your preferred MFA method, you must log out and log back in to access this ${accessScopeLabel}.`
  }

  const methodList = joinArray(
    requiredMethods.map(formatMfaRequirementMethodLabel),
    'disjunction',
  )
  const hasAnyMfaEnabled =
    mfaSettings.authenticator.enabled || mfaSettings.sms.enabled

  if (!hasAnyMfaEnabled) {
    return `requires ${methodList} multi factor authentication to be configured before accessing this ${accessScopeLabel}.`
  }

  if (!hasPreferredEnabledRequiredMethod(mfaRequirement, mfaSettings)) {
    return `requires ${methodList} multi factor authentication. Please change your preferred MFA method to one of the accepted methods to access this ${accessScopeLabel}.`
  }

  return `requires ${methodList} multi factor authentication. Now that your preferred MFA method meets this requirement, you must log out and log back in to access this ${accessScopeLabel}.`
}

export function formatMfaMethodRequirementMessage(
  method: MfaRequirementMethod,
  mfaRequirement: MiscTypes.MfaRequirement | undefined,
  mfaSettings: MfaSettings,
  accessScopeLabel = 'app',
): string | undefined {
  if (!mfaRequirement || !isMfaRequired(mfaRequirement)) {
    return undefined
  }

  const scope = accessScopeLabel.toLowerCase()

  if (!mfaRequirement[method]) {
    return formatMfaMethodNotAcceptedMessage(
      method,
      mfaRequirement,
      accessScopeLabel,
    )
  }

  if (userMeetsMfaRequirement(mfaRequirement, mfaSettings)) {
    return undefined
  }

  const methodLabel = formatMfaRequirementMethodLabel(method)
  const isMethodEnabled = isMfaMethodEnabled(mfaSettings, method)
  const isMethodPreferred = isMfaMethodPreferred(mfaSettings, method)

  const firstSentence = `Your administrator requires ${methodLabel} multi factor authentication.`

  if (!isMethodEnabled) {
    return `${firstSentence} Setup ${methodLabel} to access this ${scope}`
  }

  if (!isMethodPreferred) {
    return `${firstSentence} Set ${methodLabel} as your preferred MFA method to access this ${scope}.`
  }

  return `${firstSentence} Now that ${methodLabel} is your preferred MFA method, you must log out and log back in to access this ${scope}.`
}
