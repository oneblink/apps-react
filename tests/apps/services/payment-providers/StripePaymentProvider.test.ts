import {
  FormTypes,
  SubmissionEventTypes,
  SubmissionTypes,
} from '@oneblink/types'
import { FormSubmissionResult } from '../../../../src/apps/types/submissions'
import OneBlinkAppsError from '../../../../src/apps/services/errors/oneBlinkAppsError'
import { describe, expect, test, vi, beforeEach } from 'vitest'

const { verifyPaymentTransaction } = vi.hoisted(() => ({
  verifyPaymentTransaction: vi.fn(),
}))

vi.mock('../../../../src/apps/services/api/payment', () => ({
  verifyPaymentTransaction,
}))

vi.mock('../../../../src/apps', () => ({
  localisationService: {
    formatCurrency: vi.fn((amount: number) => `$${amount.toFixed(2)}`),
    formatDatetimeLong: vi.fn(() => 'formatted-date'),
  },
}))

import { localisationService } from '../../../../src/apps'
import StripePaymentProvider from '../../../../src/apps/services/payment-providers/StripePaymentProvider'

const definition: FormTypes.Form = {
  id: 1,
  name: 'Test Form',
  description: 'A test form',
  organisationId: 'org-1',
  formsAppEnvironmentId: 1,
  formsAppIds: [],
  elements: [],
  isAuthenticated: false,
  isMultiPage: false,
  postSubmissionAction: 'FORMS_LIBRARY',
  cancelAction: 'FORMS_LIBRARY',
  submissionEvents: [],
  tags: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const baseFormSubmissionResult: FormSubmissionResult = {
  formsAppId: 1,
  definition,
  submission: { name: 'test' },
  jobId: undefined,
  formSubmissionDraftId: undefined,
  externalId: undefined,
  preFillFormDataId: null,
  submissionId: 'sub-123',
  submissionTimestamp: '2024-01-01T00:00:00.000Z',
  payment: null,
  scheduling: null,
  isInPendingQueue: false,
  isOffline: false,
  isUploadingAttachments: false,
}

const basePaymentEvent: SubmissionEventTypes.StripeSubmissionEvent = {
  type: 'STRIPE',
  configuration: {
    elementId: 'element-1',
    environmentId: 'environment-1',
    productName: 'Test Product',
  },
}

const paidCheckoutSession: SubmissionTypes.StripeCheckoutSession = {
  id: 'cs_test_123',
  object: 'checkout.session',
  client_reference_id: 'sub-123',
  customer_details: { email: 'jenny@example.com', name: 'Jenny Rosen' },
  amount_total: 9995,
  currency: 'usd',
  created: 1700000000,
  livemode: false,
  payment_status: 'paid',
  status: 'complete',
  payment_intent: {
    id: 'pi_123',
    object: 'payment_intent',
    created: 1700000000,
    status: 'succeeded',
    latest_charge: {
      id: 'ch_123',
      object: 'charge',
      amount: 9995,
      created: 1700000000,
      status: 'succeeded',
      payment_method_details: {
        type: 'card',
        card: { brand: 'visa', last4: '4242' },
      },
    },
  },
}

function getReceiptItemLabels(
  result: Awaited<ReturnType<StripePaymentProvider['verifyPaymentTransaction']>>,
) {
  return result.receiptItems.map((item) => item.label)
}

describe('StripePaymentProvider', () => {
  let provider: InstanceType<typeof StripePaymentProvider>

  beforeEach(() => {
    verifyPaymentTransaction.mockReset()
    verifyPaymentTransaction.mockResolvedValue(paidCheckoutSession)
    vi.mocked(localisationService.formatDatetimeLong).mockClear()
    provider = new StripePaymentProvider(
      basePaymentEvent,
      baseFormSubmissionResult,
    )
  })

  describe('constructor', () => {
    test('should set paymentSubmissionEvent and formSubmissionResult', () => {
      expect(provider.paymentSubmissionEvent).toBe(basePaymentEvent)
      expect(provider.formSubmissionResult).toBe(baseFormSubmissionResult)
    })
  })

  describe('verifyPaymentTransaction', () => {
    const validQuery: Record<string, unknown> = {
      paymentId: 'b1946ac9-2f5e-4c7e-9a0e-3f1d2c4b5a60',
    }

    test('should throw without calling the API when paymentId is missing', async () => {
      const promise = provider.verifyPaymentTransaction({})
      await expect(promise).rejects.toThrow(OneBlinkAppsError)
      await expect(promise).rejects.toThrow(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
      expect(verifyPaymentTransaction).not.toHaveBeenCalled()
    })

    test('should request the Checkout Session from the API by payment ID', async () => {
      await provider.verifyPaymentTransaction(validQuery)
      expect(verifyPaymentTransaction).toHaveBeenCalledWith(
        '/forms/1/stripe-verification',
        { paymentId: 'b1946ac9-2f5e-4c7e-9a0e-3f1d2c4b5a60' },
      )
    })

    test('should pass through errors from the API', async () => {
      const error = new OneBlinkAppsError('API error')
      verifyPaymentTransaction.mockRejectedValue(error)
      await expect(provider.verifyPaymentTransaction(validQuery)).rejects.toBe(
        error,
      )
    })

    test('should throw when the Checkout Session is for another submission', async () => {
      verifyPaymentTransaction.mockResolvedValue({
        ...paidCheckoutSession,
        client_reference_id: 'other-submission',
      })
      await expect(
        provider.verifyPaymentTransaction(validQuery),
      ).rejects.toThrow(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    })

    test('should throw when the Checkout Session has no submission', async () => {
      verifyPaymentTransaction.mockResolvedValue({
        ...paidCheckoutSession,
        client_reference_id: null,
      })
      await expect(
        provider.verifyPaymentTransaction(validQuery),
      ).rejects.toThrow(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    })

    test('should throw when formSubmissionResult has a null submissionId', async () => {
      const providerWithNullId = new StripePaymentProvider(basePaymentEvent, {
        ...baseFormSubmissionResult,
        submissionId: null,
      })
      await expect(
        providerWithNullId.verifyPaymentTransaction(validQuery),
      ).rejects.toThrow(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    })

    test('should show the Stripe payment details for a paid session', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      expect(result.transaction.isSuccess).toBe(true)
      expect(result.transaction.errorMessage).toBeUndefined()
      expect(result.submissionResult).toBe(baseFormSubmissionResult)
      expect(
        result.receiptItems.map((item) => [item.label, item.value]),
      ).toEqual([
        ['Submission Id', 'sub-123'],
        ['Payment Reference', 'cs_test_123'],
        ['Customer Email', 'jenny@example.com'],
        ['Date', 'formatted-date'],
        ['Card Number', 'xxxx xxxx xxxx 4242'],
        ['Amount', '$99.95'],
      ])
    })

    test('should format the Checkout Session created time from seconds since the epoch', async () => {
      await provider.verifyPaymentTransaction(validQuery)
      expect(localisationService.formatDatetimeLong).toHaveBeenCalledWith(
        new Date(1700000000 * 1000),
      )
    })

    test('should allow the payment reference to be copied', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      const item = result.receiptItems.find(
        (item) => item.label === 'Payment Reference',
      )
      expect(item?.allowCopyToClipboard).toBe(true)
    })

    test('should treat a session that requires no payment as successful', async () => {
      verifyPaymentTransaction.mockResolvedValue({
        ...paidCheckoutSession,
        amount_total: 0,
        payment_status: 'no_payment_required',
        payment_intent: null,
      })
      const result = await provider.verifyPaymentTransaction(validQuery)
      expect(result.transaction.isSuccess).toBe(true)
      expect(getReceiptItemLabels(result)).toEqual([
        'Submission Id',
        'Payment Reference',
        'Customer Email',
        'Date',
        'Amount',
      ])
      expect(
        result.receiptItems.find((item) => item.label === 'Amount')?.value,
      ).toBe('$0.00')
    })

    test('should omit card number when the payment was not made by card', async () => {
      verifyPaymentTransaction.mockResolvedValue({
        ...paidCheckoutSession,
        payment_intent: {
          ...paidCheckoutSession.payment_intent,
          latest_charge: {
            ...paidCheckoutSession.payment_intent.latest_charge,
            payment_method_details: { type: 'us_bank_account' },
          },
        },
      })
      const result = await provider.verifyPaymentTransaction(validQuery)
      expect(getReceiptItemLabels(result)).toEqual([
        'Submission Id',
        'Payment Reference',
        'Customer Email',
        'Date',
        'Amount',
      ])
    })

    test('should omit card number when no payment has been attempted yet', async () => {
      verifyPaymentTransaction.mockResolvedValue({
        ...paidCheckoutSession,
        status: 'open',
        payment_status: 'unpaid',
        payment_intent: {
          ...paidCheckoutSession.payment_intent,
          latest_charge: null,
        },
      })
      const result = await provider.verifyPaymentTransaction(validQuery)
      expect(result.transaction.isSuccess).toBe(false)
      expect(getReceiptItemLabels(result)).not.toContain('Card Number')
    })

    test('should show a pending state when the payment is still being processed', async () => {
      verifyPaymentTransaction.mockResolvedValue({
        ...paidCheckoutSession,
        payment_status: 'unpaid',
      })
      const result = await provider.verifyPaymentTransaction(validQuery)
      expect(result.transaction.isSuccess).toBe(true)
      expect(result.transaction.errorMessage).toBeUndefined()
      expect(
        result.receiptItems.find((item) => item.label === 'Payment Status')
          ?.value,
      ).toBe('Pending')
    })

    test('should not show a pending state for a paid session', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      expect(getReceiptItemLabels(result)).not.toContain('Payment Status')
    })

    test.each(['open', 'expired', null, undefined] as const)(
      'should show the cancelled state when the session status is %s',
      async (status) => {
        verifyPaymentTransaction.mockResolvedValue({
          ...paidCheckoutSession,
          status,
          payment_status: 'unpaid',
          customer_details: null,
          payment_intent: null,
        })
        const result = await provider.verifyPaymentTransaction(validQuery)
        expect(result.transaction.isSuccess).toBe(false)
        expect(result.transaction.errorMessage).toBe('Payment Cancelled')
        expect(getReceiptItemLabels(result)).toEqual([
          'Submission Id',
          'Payment Reference',
          'Date',
          'Amount',
        ])
      },
    )
  })
})
