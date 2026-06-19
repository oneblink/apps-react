import { describe, expect, test } from 'vitest'
import {
  formatMfaRequirementLabel,
  formatMfaRequirementMethodLabel,
  formatMfaSetupRequiredMessage,
  isMfaRequired,
  mfaSelectedMethodsToMfaRequirement,
  mfaRequirementToSelectedMethods,
  userMeetsMfaRequirement,
  type MfaSettings,
} from '../../src/utils/mfa-requirement'

const emptyMfaSettings: MfaSettings = {
  authenticator: { enabled: false, preferred: false },
  sms: {
    enabled: false,
    preferred: false,
    phoneNumber: undefined,
    isPhoneNumberVerified: false,
  },
}

const authenticatorMfaSettings: MfaSettings = {
  authenticator: { enabled: true, preferred: true },
  sms: {
    enabled: false,
    preferred: false,
    phoneNumber: undefined,
    isPhoneNumberVerified: false,
  },
}

const smsMfaSettings: MfaSettings = {
  authenticator: { enabled: false, preferred: false },
  sms: {
    enabled: true,
    preferred: true,
    phoneNumber: '+61400000000',
    isPhoneNumberVerified: true,
  },
}

describe('isMfaRequired', () => {
  test('returns false when requirement is undefined or empty', () => {
    expect(isMfaRequired(undefined)).toBe(false)
    expect(isMfaRequired({ sms: false, authenticatorApp: false })).toBe(false)
  })

  test('returns true when at least one method is required', () => {
    expect(isMfaRequired({ sms: true, authenticatorApp: false })).toBe(true)
    expect(isMfaRequired({ sms: false, authenticatorApp: true })).toBe(true)
    expect(isMfaRequired({ sms: true, authenticatorApp: true })).toBe(true)
  })
})

describe('mfaRequirementToSelectedMethods', () => {
  test('returns selected methods from a requirement', () => {
    expect(
      mfaRequirementToSelectedMethods({
        sms: true,
        authenticatorApp: true,
      }),
    ).toEqual(['authenticatorApp', 'sms'])
    expect(
      mfaRequirementToSelectedMethods({
        sms: false,
        authenticatorApp: true,
      }),
    ).toEqual(['authenticatorApp'])
    expect(mfaRequirementToSelectedMethods(undefined)).toEqual([])
  })
})

describe('mfaSelectedMethodsToMfaRequirement', () => {
  test('returns the selected methods', () => {
    expect(
      mfaSelectedMethodsToMfaRequirement(['sms', 'authenticatorApp']),
    ).toEqual({
      sms: true,
      authenticatorApp: true,
    })
  })
})

describe('formatMfaRequirementLabel', () => {
  test('formats each requirement option', () => {
    expect(formatMfaRequirementLabel(undefined)).toBe('MFA Optional')
    expect(
      formatMfaRequirementLabel({ sms: true, authenticatorApp: false }),
    ).toBe('MFA Required (SMS only)')
    expect(
      formatMfaRequirementLabel({ sms: false, authenticatorApp: true }),
    ).toBe('MFA Required (Authenticator App only)')
    expect(
      formatMfaRequirementLabel({ sms: true, authenticatorApp: true }),
    ).toBe('MFA Required')
  })
})

describe('formatMfaRequirementMethodLabel', () => {
  test('formats each method', () => {
    expect(formatMfaRequirementMethodLabel('sms')).toBe('SMS')
    expect(formatMfaRequirementMethodLabel('authenticatorApp')).toBe(
      'Authenticator App',
    )
  })
})

describe('userMeetsMfaRequirement', () => {
  test('returns true when MFA is optional', () => {
    expect(userMeetsMfaRequirement(undefined, emptyMfaSettings)).toBe(true)
  })

  test('returns true when any required method is enabled', () => {
    expect(
      userMeetsMfaRequirement(
        { sms: true, authenticatorApp: true },
        authenticatorMfaSettings,
      ),
    ).toBe(true)
    expect(
      userMeetsMfaRequirement(
        { sms: true, authenticatorApp: false },
        smsMfaSettings,
      ),
    ).toBe(true)
  })

  test('returns false when no required method is enabled', () => {
    expect(
      userMeetsMfaRequirement(
        { sms: true, authenticatorApp: false },
        emptyMfaSettings,
      ),
    ).toBe(false)
    expect(
      userMeetsMfaRequirement(
        { sms: true, authenticatorApp: false },
        authenticatorMfaSettings,
      ),
    ).toBe(false)
  })
})

describe('formatMfaSetupRequiredMessage', () => {
  test('returns undefined when the requirement is met', () => {
    expect(
      formatMfaSetupRequiredMessage(
        { sms: true, authenticatorApp: false },
        smsMfaSettings,
      ),
    ).toBeUndefined()
  })

  test('describes a missing single required method', () => {
    expect(
      formatMfaSetupRequiredMessage(
        { sms: true, authenticatorApp: false },
        emptyMfaSettings,
      ),
    ).toBe(
      'requires SMS multi factor authentication to be configured before accessing this Account.',
    )
  })

  test('describes an unaccepted method when another MFA method is enabled', () => {
    expect(
      formatMfaSetupRequiredMessage(
        { sms: true, authenticatorApp: false },
        authenticatorMfaSettings,
      ),
    ).toBe(
      'requires SMS multi factor authentication. You have a different MFA method configured, but that method is not accepted for this account.',
    )
  })

  test('describes multiple accepted methods', () => {
    expect(
      formatMfaSetupRequiredMessage(
        { sms: true, authenticatorApp: true },
        emptyMfaSettings,
      ),
    ).toBe(
      'requires Authenticator App or SMS multi factor authentication to be configured before accessing this Account.',
    )
  })

  test('uses a custom access scope label', () => {
    expect(
      formatMfaSetupRequiredMessage(
        { sms: true, authenticatorApp: false },
        emptyMfaSettings,
        'App',
      ),
    ).toBe(
      'requires SMS multi factor authentication to be configured before accessing this App.',
    )
  })
})
