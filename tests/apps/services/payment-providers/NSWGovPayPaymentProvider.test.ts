import { FormTypes, SubmissionEventTypes } from '@oneblink/types'
import { FormSubmissionResult } from '../../../../src/apps/types/submissions'
import OneBlinkAppsError from '../../../../src/apps/services/errors/oneBlinkAppsError'
import { describe, expect, test, vi, beforeEach } from 'vitest'

vi.mock('../../../../src/apps/services/replaceInjectablesWithSubmissionValues', () => ({
  default: vi.fn((text: string) => ({ text })),
}))

vi.mock('../../../../src/apps', () => ({
  localisationService: {
    formatCurrency: vi.fn((amount: number) => `$${amount.toFixed(2)}`),
    formatDate: vi.fn((date: Date) => date.toISOString().split('T')[0]),
    generateDate: vi.fn(({ value }: { value: string }) => new Date(value)),
  },
}))

import NSWGovPayPaymentProvider from '../../../../src/apps/services/payment-providers/NSWGovPayPaymentProvider'

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

const basePaymentEvent: SubmissionEventTypes.NSWGovPaySubmissionEvent = {
  type: 'NSW_GOV_PAY',
  configuration: {
    elementId: 'element-1',
    primaryAgencyId: 'agency-1',
    productDescription: 'Test Product',
  },
}

describe('NSWGovPayPaymentProvider', () => {
  let provider: InstanceType<typeof NSWGovPayPaymentProvider>

  beforeEach(() => {
    provider = new NSWGovPayPaymentProvider(
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

  describe('preparePaymentConfiguration', () => {
    const basePayload = {
      amount: 100,
      redirectUrl: 'https://example.com/receipt',
      submissionId: 'sub-123',
    }

    test('should return the correct path using the form id', () => {
      const result = provider.preparePaymentConfiguration(basePayload)
      expect(result.path).toBe('/forms/1/nsw-gov-pay-payment')
    })

    test('should spread the base payload into the result payload', () => {
      const result = provider.preparePaymentConfiguration(basePayload)
      expect(result.payload.amount).toBe(100)
      expect(result.payload.redirectUrl).toBe('https://example.com/receipt')
      expect(result.payload.submissionId).toBe('sub-123')
    })

    test('should include integrationPrimaryAgencyId from event configuration', () => {
      const result = provider.preparePaymentConfiguration(basePayload)
      expect(result.payload).toHaveProperty(
        'integrationPrimaryAgencyId',
        'agency-1',
      )
    })

    test('should include productDescription from replaceInjectables', () => {
      const result = provider.preparePaymentConfiguration(basePayload)
      expect(result.payload).toHaveProperty(
        'productDescription',
        'Test Product',
      )
    })

    test('should include customerReference when configured', () => {
      const providerWithRef = new NSWGovPayPaymentProvider(
        {
          ...basePaymentEvent,
          configuration: {
            ...basePaymentEvent.configuration,
            customerReference: 'REF-{ELEMENT:name}',
          },
        },
        baseFormSubmissionResult,
      )
      const result = providerWithRef.preparePaymentConfiguration(basePayload)
      expect(result.payload).toHaveProperty(
        'customerReference',
        'REF-{ELEMENT:name}',
      )
    })

    test('should not include customerReference when not configured', () => {
      const result = provider.preparePaymentConfiguration(basePayload)
      expect(result.payload).toHaveProperty('customerReference', undefined)
    })

    test('should include subAgencyCode when configured', () => {
      const providerWithCode = new NSWGovPayPaymentProvider(
        {
          ...basePaymentEvent,
          configuration: {
            ...basePaymentEvent.configuration,
            subAgencyCode: 'SUB-001',
          },
        },
        baseFormSubmissionResult,
      )
      const result = providerWithCode.preparePaymentConfiguration(basePayload)
      expect(result.payload).toHaveProperty('subAgencyCode', 'SUB-001')
    })

    test('should not include subAgencyCode when not configured', () => {
      const result = provider.preparePaymentConfiguration(basePayload)
      expect(result.payload).toHaveProperty('subAgencyCode', undefined)
    })
  })

  describe('verifyPaymentTransaction', () => {
    const validQuery: Record<string, unknown> = {
      submissionId: 'sub-123',
      isSuccess: 'true',
      paymentReference: 'PAY-REF-001',
    }

    test('should throw when submissionId is missing', async () => {
      await expect(
        provider.verifyPaymentTransaction({
          isSuccess: 'true',
          paymentReference: 'PAY-REF-001',
        }),
      ).rejects.toThrow(OneBlinkAppsError)
      await expect(
        provider.verifyPaymentTransaction({
          isSuccess: 'true',
          paymentReference: 'PAY-REF-001',
        }),
      ).rejects.toThrow(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
    })

    test('should throw when isSuccess is missing', async () => {
      await expect(
        provider.verifyPaymentTransaction({
          submissionId: 'sub-123',
          paymentReference: 'PAY-REF-001',
        }),
      ).rejects.toThrow(OneBlinkAppsError)
    })

    test('should throw when paymentReference is missing', async () => {
      await expect(
        provider.verifyPaymentTransaction({
          submissionId: 'sub-123',
          isSuccess: 'true',
        }),
      ).rejects.toThrow(OneBlinkAppsError)
    })

    test('should throw when all required fields are missing', async () => {
      await expect(provider.verifyPaymentTransaction({})).rejects.toThrow(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
    })

    test('should throw when submissionId does not match formSubmissionResult', async () => {
      await expect(
        provider.verifyPaymentTransaction({
          submissionId: 'wrong-id',
          isSuccess: 'true',
          paymentReference: 'PAY-REF-001',
        }),
      ).rejects.toThrow(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    })

    test('should return a valid result for a successful transaction', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      expect(result.transaction.isSuccess).toBe(true)
      expect(result.transaction.errorMessage).toBeUndefined()
      expect(result.submissionResult).toBe(baseFormSubmissionResult)
      expect(Array.isArray(result.receiptItems)).toBe(true)
    })

    test('should set isSuccess to false when isSuccess query param is not "true"', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        isSuccess: 'false',
      })
      expect(result.transaction.isSuccess).toBe(false)
    })

    test('should include errorMessage when provided', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        isSuccess: 'false',
        errorMessage: 'Payment declined',
      })
      expect(result.transaction.errorMessage).toBe('Payment declined')
    })

    test('should include payment reference in receipt items', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      const paymentRefItem = result.receiptItems.find(
        (item) => item.label === 'Payment Reference',
      )
      expect(paymentRefItem).toBeDefined()
      expect(paymentRefItem?.value).toBe('PAY-REF-001')
    })

    test('should include submission id in receipt items', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      const submissionIdItem = result.receiptItems.find(
        (item) => item.label === 'Submission Id',
      )
      expect(submissionIdItem).toBeDefined()
      expect(submissionIdItem?.value).toBe('sub-123')
    })

    test('should include completion reference when provided', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        completionReference: 'COMP-REF-001',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'Completion Reference',
      )
      expect(item).toBeDefined()
      expect(item?.value).toBe('COMP-REF-001')
    })

    test('should not include completion reference when not provided', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      const item = result.receiptItems.find(
        (item) => item.label === 'Completion Reference',
      )
      expect(item).toBeUndefined()
    })

    test('should include bank reference when provided', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        bankReference: 'BANK-REF-001',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'Bank Reference',
      )
      expect(item).toBeDefined()
      expect(item?.value).toBe('BANK-REF-001')
    })

    test('should not include bank reference when not provided', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      const item = result.receiptItems.find(
        (item) => item.label === 'Bank Reference',
      )
      expect(item).toBeUndefined()
    })

    test('should map CARD payment method to "Credit Card"', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        paymentMethod: 'CARD',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'Payment Method',
      )
      expect(item).toBeDefined()
      expect(item?.value).toBe('Credit Card')
    })

    test('should map PAYID payment method to "PayID"', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        paymentMethod: 'PAYID',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'Payment Method',
      )
      expect(item?.value).toBe('PayID')
    })

    test('should map PAYPAL payment method to "PayPal"', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        paymentMethod: 'PAYPAL',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'Payment Method',
      )
      expect(item?.value).toBe('PayPal')
    })

    test('should map BPAY payment method to "BPay"', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        paymentMethod: 'BPAY',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'Payment Method',
      )
      expect(item?.value).toBe('BPay')
    })

    test('should pass through unknown payment method as-is', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        paymentMethod: 'CRYPTO',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'Payment Method',
      )
      expect(item?.value).toBe('CRYPTO')
    })

    test('should not include payment method when not provided', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      const item = result.receiptItems.find(
        (item) => item.label === 'Payment Method',
      )
      expect(item).toBeUndefined()
    })

    test('should include masked card number when cardLast4Digits provided', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        cardLast4Digits: '4242',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'Card Number',
      )
      expect(item).toBeDefined()
      expect(item?.value).toBe('xxxx xxxx xxxx 4242')
    })

    test('should not include card number when cardLast4Digits not provided', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      const item = result.receiptItems.find(
        (item) => item.label === 'Card Number',
      )
      expect(item).toBeUndefined()
    })

    test('should include BPay biller code when provided', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        bPayBillerCode: '12345',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'BPay Biller Code',
      )
      expect(item).toBeDefined()
      expect(item?.value).toBe('12345')
    })

    test('should include BPay CRN when provided', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        bPayCrn: 'CRN-67890',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'BPay Reference',
      )
      expect(item).toBeDefined()
      expect(item?.value).toBe('CRN-67890')
    })

    test('should include formatted BPay processing date when provided', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        bPayProcessingDate: '2024-06-15',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'BPay Processing Date',
      )
      expect(item).toBeDefined()
      expect(item?.value).toBe('2024-06-15')
    })

    test('should not include BPay processing date when not provided', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      const item = result.receiptItems.find(
        (item) => item.label === 'BPay Processing Date',
      )
      expect(item).toBeUndefined()
    })

    test('should include formatted amount when provided as string', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        amount: '99.95',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'Amount',
      )
      expect(item).toBeDefined()
      expect(item?.value).toBe('$99.95')
    })

    test('should not include amount when not provided', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      const item = result.receiptItems.find(
        (item) => item.label === 'Amount',
      )
      expect(item).toBeUndefined()
    })

    test('should include formatted surcharge when provided', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        surcharge: '1.50',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'Surcharge Amount',
      )
      expect(item).toBeDefined()
      expect(item?.value).toBe('$1.50')
    })

    test('should not include surcharge when not provided', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      const item = result.receiptItems.find(
        (item) => item.label === 'Surcharge Amount',
      )
      expect(item).toBeUndefined()
    })

    test('should include formatted surcharge GST when provided', async () => {
      const result = await provider.verifyPaymentTransaction({
        ...validQuery,
        surchargeGst: '0.15',
      })
      const item = result.receiptItems.find(
        (item) => item.label === 'Surcharge GST',
      )
      expect(item).toBeDefined()
      expect(item?.value).toBe('$0.15')
    })

    test('should not include surcharge GST when not provided', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      const item = result.receiptItems.find(
        (item) => item.label === 'Surcharge GST',
      )
      expect(item).toBeUndefined()
    })

    test('should include all receipt items when all fields are provided', async () => {
      const fullQuery: Record<string, unknown> = {
        submissionId: 'sub-123',
        isSuccess: 'true',
        paymentReference: 'PAY-REF-001',
        completionReference: 'COMP-REF-001',
        bankReference: 'BANK-REF-001',
        paymentMethod: 'CARD',
        cardLast4Digits: '4242',
        bPayBillerCode: '12345',
        bPayCrn: 'CRN-67890',
        bPayProcessingDate: '2024-06-15',
        amount: '250.00',
        surcharge: '2.50',
        surchargeGst: '0.25',
      }
      const result = await provider.verifyPaymentTransaction(fullQuery)

      expect(result.receiptItems.length).toBeGreaterThanOrEqual(10)
      expect(result.transaction.isSuccess).toBe(true)
      expect(result.submissionResult).toBe(baseFormSubmissionResult)
    })

    test('should only include mandatory receipt items when optional fields are absent', async () => {
      const result = await provider.verifyPaymentTransaction(validQuery)
      const labels = result.receiptItems.map((item) => item.label)
      expect(labels).toContain('Submission Id')
      expect(labels).toContain('Payment Reference')
      expect(labels).not.toContain('Completion Reference')
      expect(labels).not.toContain('Bank Reference')
      expect(labels).not.toContain('Card Number')
      expect(labels).not.toContain('Amount')
    })

    test('should handle submissionResult with null submissionId', async () => {
      const providerWithNullId = new NSWGovPayPaymentProvider(
        basePaymentEvent,
        { ...baseFormSubmissionResult, submissionId: null },
      )
      await expect(
        providerWithNullId.verifyPaymentTransaction({
          submissionId: 'sub-123',
          isSuccess: 'true',
          paymentReference: 'PAY-REF-001',
        }),
      ).rejects.toThrow(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    })
  })
})
