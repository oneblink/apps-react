import { SubmissionTypes } from '@oneblink/types'
import { expect, describe, it } from 'vitest'
import {
  getCancelledPaymentReceiptUrl,
  getCompletedPaymentReceiptUrl,
} from '../../src/apps/payment-service'
import { FormSubmissionResult } from '../../src/apps/types/submissions'

function submissionResult(type: string): FormSubmissionResult {
  return {
    submissionId: 'submission-1',
    payment: {
      amount: 25.5,
      paymentReceiptUrl: 'https://forms.example.com/payment-receipt',
      submissionEvent: { type },
    },
  } as FormSubmissionResult
}

const completedPayment = {
  type: 'WESTPAC_QUICK_STREAM',
  paymentTransaction: {
    paymentReferenceNumber: 'submission-1',
    receiptNumber: 'receipt-1',
    totalAmount: { amount: 25.5 },
    summaryCode: '0',
    responseDescription: 'Approved',
    creditCard: { maskedCardNumber4Digits: '1111' },
  },
} as SubmissionTypes.FormSubmissionPayment

describe('getCompletedPaymentReceiptUrl', () => {
  it('should add the completed transaction to the receipt URL', () => {
    const url = new URL(
      getCompletedPaymentReceiptUrl({
        formSubmissionResult: submissionResult('WESTPAC_QUICK_STREAM'),
        formSubmissionPayment: completedPayment,
      }),
    )
    expect(url.searchParams.get('paymentReferenceNumber')).toBe('submission-1')
    expect(url.searchParams.get('receiptNumber')).toBe('receipt-1')
    expect(url.searchParams.get('totalAmount')).toBe('25.5')
    expect(url.searchParams.get('summaryCode')).toBe('0')
    expect(url.searchParams.get('responseDescription')).toBe('Approved')
    expect(url.searchParams.get('maskedCardNumber4Digits')).toBe('1111')
  })

  it('should reject hosted payment providers', () => {
    expect(() =>
      getCompletedPaymentReceiptUrl({
        formSubmissionResult: submissionResult('CP_PAY'),
        formSubmissionPayment: completedPayment,
      }),
    ).toThrow(
      'It looks like you are attempting to view a receipt for an unsupported payment.',
    )
  })
})

describe('getCancelledPaymentReceiptUrl', () => {
  it('should add the cancelled transaction to the receipt URL', () => {
    const url = new URL(
      getCancelledPaymentReceiptUrl(
        submissionResult('WESTPAC_QUICK_STREAM'),
        'payment-1',
      ),
    )
    expect(url.searchParams.get('paymentReferenceNumber')).toBe('submission-1')
    expect(url.searchParams.get('receiptNumber')).toBe('payment-1')
    expect(url.searchParams.get('totalAmount')).toBe('25.5')
    expect(url.searchParams.get('summaryCode')).toBe('1')
    expect(url.searchParams.get('responseDescription')).toBe(
      'Payment Cancelled',
    )
  })

  it('should reject hosted payment providers', () => {
    expect(() =>
      getCancelledPaymentReceiptUrl(submissionResult('CP_PAY'), 'payment-1'),
    ).toThrow(
      'It looks like you are attempting to view a receipt for an unsupported payment.',
    )
  })
})
