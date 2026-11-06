import { expect, describe, it } from 'vitest'
import {
  getPaymentFormSession,
  getPaymentHandoff,
  paymentProviderRendersInApp,
} from '../../src/apps/services/payment-handoff'
import { SubmissionEventTypes } from '@oneblink/types'

const hostedFormUrl =
  'https://forms.example.com/payment-form?formSubmissionPaymentId=payment-1'

const westpacEvent = {
  type: 'WESTPAC_QUICK_STREAM',
  configuration: {
    environmentId: 'env-1',
    customerReferenceNumber: 'ref-{{submissionId}}',
  },
} as unknown as SubmissionEventTypes.WestpacQuickStreamSubmissionEvent

const cpPayEvent = {
  type: 'CP_PAY',
  configuration: {},
} as unknown as SubmissionEventTypes.FormPaymentEvent

describe('paymentProviderRendersInApp', () => {
  it('should render Westpac QuickStream in the app', () => {
    expect(paymentProviderRendersInApp('WESTPAC_QUICK_STREAM')).toBe(true)
  })

  it('should not render hosted providers in the app', () => {
    expect(paymentProviderRendersInApp('CP_PAY')).toBe(false)
    expect(paymentProviderRendersInApp('BPOINT')).toBe(false)
    expect(paymentProviderRendersInApp('NSW_GOV_PAY')).toBe(false)
  })
})

describe('getPaymentHandoff', () => {
  it('should return the hosted form URL unchanged for hosted providers', () => {
    expect(
      getPaymentHandoff({
        hostedFormUrl: 'https://provider.example.com/pay',
        paymentSubmissionEvent: cpPayEvent,
        formId: 1,
        amount: 10,
      }),
    ).toBe('https://provider.example.com/pay')
  })

  it('should append the payment session for in-app providers', () => {
    const result = getPaymentHandoff({
      hostedFormUrl,
      paymentSubmissionEvent: westpacEvent,
      formId: 42,
      amount: 25.5,
      customerReferenceNumber: 'resolved-ref',
    })
    const url = new URL(result)
    expect(url.searchParams.get('formSubmissionPaymentId')).toBe('payment-1')
    expect(url.searchParams.get('paymentType')).toBe('WESTPAC_QUICK_STREAM')
    expect(url.searchParams.get('formId')).toBe('42')
    expect(url.searchParams.get('integrationEnvironmentId')).toBe('env-1')
    expect(url.searchParams.get('amount')).toBe('25.5')
    expect(url.searchParams.get('customerReferenceNumber')).toBe('resolved-ref')
  })

  it('should fall back to the configured customer reference number', () => {
    const url = new URL(
      getPaymentHandoff({
        hostedFormUrl,
        paymentSubmissionEvent: westpacEvent,
        formId: 42,
        amount: 10,
      }),
    )
    expect(url.searchParams.get('customerReferenceNumber')).toBe(
      'ref-{{submissionId}}',
    )
  })
})

describe('getPaymentFormSession', () => {
  const validSearch = new URLSearchParams({
    paymentType: 'WESTPAC_QUICK_STREAM',
    formId: '42',
    formSubmissionPaymentId: 'payment-1',
    integrationEnvironmentId: 'env-1',
    amount: '25.5',
    customerReferenceNumber: 'ref-1',
  })

  it('should read a complete session from the search parameters', () => {
    expect(getPaymentFormSession(validSearch)).toEqual({
      paymentType: 'WESTPAC_QUICK_STREAM',
      formId: 42,
      formSubmissionPaymentId: 'payment-1',
      integrationEnvironmentId: 'env-1',
      amount: 25.5,
      customerReferenceNumber: 'ref-1',
    })
  })

  it('should round trip a handoff URL', () => {
    const url = new URL(
      getPaymentHandoff({
        hostedFormUrl,
        paymentSubmissionEvent: westpacEvent,
        formId: 42,
        amount: 25.5,
        customerReferenceNumber: 'ref-1',
      }),
    )
    expect(getPaymentFormSession(url.search)).toEqual({
      paymentType: 'WESTPAC_QUICK_STREAM',
      formId: 42,
      formSubmissionPaymentId: 'payment-1',
      integrationEnvironmentId: 'env-1',
      amount: 25.5,
      customerReferenceNumber: 'ref-1',
    })
  })

  it('should throw when a session value is missing', () => {
    const params = new URLSearchParams(validSearch)
    params.delete('integrationEnvironmentId')
    expect(() => getPaymentFormSession(params)).toThrow(
      'This payment link is missing details.',
    )
  })

  it('should throw for unsupported payment types', () => {
    const params = new URLSearchParams(validSearch)
    params.set('paymentType', 'CP_PAY')
    expect(() => getPaymentFormSession(params)).toThrow()
  })
})
