import { MiscTypes } from '@oneblink/types'
import type { MfaSettings } from '../apps/services/AWSCognitoClient'
import { joinArray } from './joinArray'

export type { MfaSettings }

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

export function formatMfaRequirementMethodLabel(
  method: MfaRequirementMethod,
): string {
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

export function userMeetsMfaRequirement(
  mfaRequirement: MiscTypes.MfaRequirement | undefined,
  mfaSettings: MfaSettings,
): boolean {
  if (!isMfaRequired(mfaRequirement)) {
    return true
  }

  if (
    mfaRequirement?.sms &&
    mfaSettings.sms.enabled &&
    mfaSettings.sms.preferred
  ) {
    return true
  }

  if (
    mfaRequirement?.authenticatorApp &&
    mfaSettings.authenticator.enabled &&
    mfaSettings.authenticator.preferred
  ) {
    return true
  }

  return false
}

export function formatMfaMethodNotAcceptedMessage(
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

export function formatMfaSetupRequiredMessage(
  mfaRequirement: MiscTypes.MfaRequirement | undefined,
  mfaSettings: MfaSettings,
  accessScopeLabel = 'Account',
): string | undefined {
  if (
    !isMfaRequired(mfaRequirement) ||
    userMeetsMfaRequirement(mfaRequirement, mfaSettings)
  ) {
    return undefined
  }

  const requiredMethods = mfaRequirementToSelectedMethods(mfaRequirement)
  const hasAnyMfaEnabled =
    mfaSettings.authenticator.enabled || mfaSettings.sms.enabled

  if (requiredMethods.length === 1) {
    const methodLabel = formatMfaRequirementMethodLabel(requiredMethods[0])

    if (hasAnyMfaEnabled) {
      return `requires ${methodLabel} multi factor authentication. You have a different MFA method configured, but that method is not accepted for this ${accessScopeLabel.toLowerCase()}.`
    }

    return `requires ${methodLabel} multi factor authentication to be configured before accessing this ${accessScopeLabel}.`
  }

  const methodList = joinArray(
    requiredMethods.map(formatMfaRequirementMethodLabel),
    'disjunction',
  )

  if (hasAnyMfaEnabled) {
    return `requires ${methodList} multi factor authentication. Your current MFA method is not accepted for this ${accessScopeLabel.toLowerCase()}.`
  }

  return `requires ${methodList} multi factor authentication to be configured before accessing this ${accessScopeLabel}.`
}
