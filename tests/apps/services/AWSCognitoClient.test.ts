import { describe, expect, test } from 'vitest'
import {
  resolveLoggedInMfaMethod,
  resolveMfaPreferredFlags,
} from '../../../src/apps/services/AWSCognitoClient'

function createTestIdToken(payload: Record<string, unknown>) {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')

  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.signature`
}

describe('resolveLoggedInMfaMethod', () => {
  test('returns valid Cognito MFA methods from the id token', () => {
    expect(
      resolveLoggedInMfaMethod(
        createTestIdToken({ mfa_method: 'SOFTWARE_TOKEN_MFA' }),
      ),
    ).toBe('SOFTWARE_TOKEN_MFA')
    expect(
      resolveLoggedInMfaMethod(createTestIdToken({ mfa_method: 'SMS_MFA' })),
    ).toBe('SMS_MFA')
  })

  test('falls back to NO_MFA_ENABLED for missing or invalid tokens', () => {
    expect(resolveLoggedInMfaMethod(undefined)).toBe('NO_MFA_ENABLED')
    expect(resolveLoggedInMfaMethod('not-a-jwt')).toBe('NO_MFA_ENABLED')
    expect(
      resolveLoggedInMfaMethod(createTestIdToken({ mfa_method: 'UNKNOWN' })),
    ).toBe('NO_MFA_ENABLED')
    expect(resolveLoggedInMfaMethod(createTestIdToken({}))).toBe(
      'NO_MFA_ENABLED',
    )
  })
})

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
