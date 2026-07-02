import { describe, expect, test } from 'vitest'
import {
  formatMfaMethodRequirementMessage,
  formatMfaRequirementLabel,
  formatMfaSetupRequiredMessage,
  isMfaMethodUsedForLogin,
  isMfaRequired,
  mfaSelectedMethodsToMfaRequirement,
  mfaRequirementToSelectedMethods,
  userMeetsMfaRequirement,
  type MfaSettings,
} from '../../src/utils/mfa-requirement'

const emptyMfaSettings: MfaSettings = {
  loggedInWithMfaMethod: 'NO_MFA_ENABLED',
  authenticator: { enabled: false, preferred: false },
  sms: {
    enabled: false,
    preferred: false,
    phoneNumber: undefined,
    isPhoneNumberVerified: false,
  },
}

const authenticatorMfaSettings: MfaSettings = {
  loggedInWithMfaMethod: 'SOFTWARE_TOKEN_MFA',
  authenticator: { enabled: true, preferred: true },
  sms: {
    enabled: false,
    preferred: false,
    phoneNumber: undefined,
    isPhoneNumberVerified: false,
  },
}

const smsMfaSettings: MfaSettings = {
  loggedInWithMfaMethod: 'SMS_MFA',
  authenticator: { enabled: false, preferred: false },
  sms: {
    enabled: true,
    preferred: true,
    phoneNumber: '+61400000000',
    isPhoneNumberVerified: true,
  },
}

const smsEnabledButLoggedInWithAuthenticator: MfaSettings = {
  loggedInWithMfaMethod: 'SOFTWARE_TOKEN_MFA',
  authenticator: { enabled: true, preferred: true },
  sms: {
    enabled: true,
    preferred: false,
    phoneNumber: '+61400000000',
    isPhoneNumberVerified: true,
  },
}

const smsConfiguredButNotUsedForLogin: MfaSettings = {
  loggedInWithMfaMethod: 'NO_MFA_ENABLED',
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

describe('formatMfaMethodRequirementMessage', () => {
  test('returns undefined when MFA is optional', () => {
    expect(formatMfaMethodRequirementMessage('sms', undefined, emptyMfaSettings)).toBeUndefined()
    expect(
      formatMfaMethodRequirementMessage(
        'sms',
        { sms: false, authenticatorApp: false },
        emptyMfaSettings,
      ),
    ).toBeUndefined()
  })

  test('returns undefined when the user meets the requirement', () => {
    expect(
      formatMfaMethodRequirementMessage(
        'sms',
        { sms: true, authenticatorApp: false },
        smsMfaSettings,
      ),
    ).toBeUndefined()
  })

  test('describes when a method is not accepted', () => {
    expect(
      formatMfaMethodRequirementMessage(
        'authenticatorApp',
        { sms: true, authenticatorApp: false },
        emptyMfaSettings,
      ),
    ).toBe(
      'This MFA method is not sufficient for using this app. Your administrator requires SMS multi factor authentication.',
    )
  })

  test('describes when a required method needs to be set as preferred', () => {
    expect(
      formatMfaMethodRequirementMessage(
        'sms',
        { sms: true, authenticatorApp: false },
        smsEnabledButLoggedInWithAuthenticator,
      ),
    ).toBe(
      'Your administrator requires SMS multi factor authentication. Set SMS as your preferred MFA method to access this app.',
    )
  })

  test('describes when a required preferred method needs a new login session', () => {
    expect(
      formatMfaMethodRequirementMessage(
        'sms',
        { sms: true, authenticatorApp: false },
        smsConfiguredButNotUsedForLogin,
      ),
    ).toBe(
      'Your administrator requires SMS multi factor authentication. Now that SMS is your preferred MFA method, you must log out and log back in to access this app.',
    )
  })

  test('describes when a required method needs to be set up', () => {
    expect(
      formatMfaMethodRequirementMessage(
        'sms',
        { sms: true, authenticatorApp: false },
        emptyMfaSettings,
      ),
    ).toBe(
      'Your administrator requires SMS multi factor authentication. Setup SMS to access this app',
    )
  })
})

describe('isMfaMethodUsedForLogin', () => {
  test('returns true when the login method matches', () => {
    expect(isMfaMethodUsedForLogin(smsMfaSettings, 'sms')).toBe(true)
    expect(
      isMfaMethodUsedForLogin(authenticatorMfaSettings, 'authenticatorApp'),
    ).toBe(true)
  })

  test('returns false when the login method does not match', () => {
    expect(isMfaMethodUsedForLogin(smsMfaSettings, 'authenticatorApp')).toBe(
      false,
    )
    expect(isMfaMethodUsedForLogin(emptyMfaSettings, 'sms')).toBe(false)
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

  test('describes when the preferred MFA method needs to change', () => {
    expect(
      formatMfaSetupRequiredMessage(
        { sms: true, authenticatorApp: false },
        smsEnabledButLoggedInWithAuthenticator,
      ),
    ).toBe(
      'requires SMS multi factor authentication. Please change your preferred MFA method to SMS to access this Account.',
    )
  })

  test('describes when MFA is configured but the preferred method needs to change', () => {
    expect(
      formatMfaSetupRequiredMessage(
        { sms: true, authenticatorApp: false },
        smsConfiguredButNotUsedForLogin,
      ),
    ).toBe(
      'requires SMS multi factor authentication. Now that SMS is your preferred MFA method, you must log out and log back in to access this Account.',
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

describe('userMeetsMfaRequirement', () => {
  test('returns true when MFA is optional', () => {
    expect(userMeetsMfaRequirement(undefined, emptyMfaSettings)).toBe(true)
  })

  test('returns true when the user logged in with a required method', () => {
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

  test('returns false when the user did not log in with a required method', () => {
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
    expect(
      userMeetsMfaRequirement(
        { sms: true, authenticatorApp: false },
        smsConfiguredButNotUsedForLogin,
      ),
    ).toBe(false)
  })
})
