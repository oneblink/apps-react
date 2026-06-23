import { describe, expect, test } from 'vitest'
import { resolveMfaPreferredFlags } from '../../../src/apps/services/AWSCognitoClient'

describe('resolveMfaPreferredFlags', () => {
  test('returns no preferred methods when none are enabled', () => {
    expect(
      resolveMfaPreferredFlags({
        authenticatorEnabled: false,
        smsEnabled: false,
        preferredMfaSetting: undefined,
      }),
    ).toEqual({
      authenticatorPreferred: false,
      smsPreferred: false,
    })
  })

  test('uses Cognito preferred setting when it matches an enabled method', () => {
    expect(
      resolveMfaPreferredFlags({
        authenticatorEnabled: true,
        smsEnabled: true,
        preferredMfaSetting: 'SMS_MFA',
      }),
    ).toEqual({
      authenticatorPreferred: false,
      smsPreferred: true,
    })
  })

  test('prefers the only enabled method when Cognito has no preferred setting', () => {
    expect(
      resolveMfaPreferredFlags({
        authenticatorEnabled: false,
        smsEnabled: true,
        preferredMfaSetting: undefined,
      }),
    ).toEqual({
      authenticatorPreferred: false,
      smsPreferred: true,
    })

    expect(
      resolveMfaPreferredFlags({
        authenticatorEnabled: true,
        smsEnabled: false,
        preferredMfaSetting: undefined,
      }),
    ).toEqual({
      authenticatorPreferred: true,
      smsPreferred: false,
    })
  })

  test('prefers authenticator when multiple methods are enabled without a preferred setting', () => {
    expect(
      resolveMfaPreferredFlags({
        authenticatorEnabled: true,
        smsEnabled: true,
        preferredMfaSetting: undefined,
      }),
    ).toEqual({
      authenticatorPreferred: true,
      smsPreferred: false,
    })
  })
})
