import { afterEach, describe, expect, it } from 'vitest'
import {
  forgetPaymentRequestToken,
  getRememberedPaymentRequestToken,
  rememberPaymentRequestToken,
} from '../../../src/apps/services/payment-request-token'

describe('payment request token', () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it('keeps a token for each submission', () => {
    rememberPaymentRequestToken('submission-1', 'token-1')
    rememberPaymentRequestToken('submission-2', 'token-2')

    expect(getRememberedPaymentRequestToken('submission-1')).toBe('token-1')
    expect(getRememberedPaymentRequestToken('submission-2')).toBe('token-2')
  })

  it('returns undefined when there is no token or no submission', () => {
    expect(getRememberedPaymentRequestToken('submission-1')).toBeUndefined()
    expect(getRememberedPaymentRequestToken(null)).toBeUndefined()
    expect(getRememberedPaymentRequestToken(undefined)).toBeUndefined()
  })

  it('forgets only the token for the submission', () => {
    rememberPaymentRequestToken('submission-1', 'token-1')
    rememberPaymentRequestToken('submission-2', 'token-2')

    forgetPaymentRequestToken('submission-1')
    forgetPaymentRequestToken(null)

    expect(getRememberedPaymentRequestToken('submission-1')).toBeUndefined()
    expect(getRememberedPaymentRequestToken('submission-2')).toBe('token-2')
  })
})
