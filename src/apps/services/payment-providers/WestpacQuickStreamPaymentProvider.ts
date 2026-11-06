import { SubmissionEventTypes, SubmissionTypes } from '@oneblink/types'
import { PaymentProvider } from '../../types/payments'
import { FormSubmissionResult } from '../../types/submissions'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import {
  generateAmountReceiptItem,
  generateCreditCardMaskReceiptItem,
  generateSubmissionIdReceiptItem,
  prepareReceiptItems,
} from './receipt-items'
import {
  cancelWestpacQuickStreamPayment,
  completeWestpacQuickStreamTransaction,
  getCustomFormPaymentConfiguration,
} from '../api/payment'
import { PaymentFormSession } from '../payment-handoff'

export default class WestpacQuickStreamPaymentProvider implements PaymentProvider<SubmissionEventTypes.WestpacQuickStreamSubmissionEvent> {
  constructor(
    paymentSubmissionEvent: SubmissionEventTypes.WestpacQuickStreamSubmissionEvent,
    formSubmissionResult: FormSubmissionResult,
  ) {
    this.formSubmissionResult = formSubmissionResult
    this.paymentSubmissionEvent = paymentSubmissionEvent
  }

  formSubmissionResult: FormSubmissionResult
  paymentSubmissionEvent: SubmissionEventTypes.WestpacQuickStreamSubmissionEvent

  async verifyPaymentTransaction(query: Record<string, unknown>) {
    const {
      paymentReferenceNumber,
      receiptNumber,
      maskedCardNumber4Digits,
      summaryCode,
      responseDescription,
      totalAmount,
    } = query as {
      paymentReferenceNumber?: string
      receiptNumber?: string
      maskedCardNumber4Digits?: string
      summaryCode?: string
      responseDescription?: string
      totalAmount?: string
    }
    if (
      !paymentReferenceNumber ||
      !receiptNumber ||
      !summaryCode ||
      !responseDescription ||
      !totalAmount
    ) {
      throw new OneBlinkAppsError(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
    }
    if (this.formSubmissionResult.submissionId !== paymentReferenceNumber) {
      throw new OneBlinkAppsError(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    }

    return {
      receiptItems: prepareReceiptItems([
        generateSubmissionIdReceiptItem(this.formSubmissionResult.submissionId),
        {
          className: 'ob-payment-receipt__transaction-id',
          valueClassName: 'cypress-payment-receipt-transaction-id',
          icon: 'shopping_cart',
          label: 'Receipt Number',
          value: receiptNumber,
          allowCopyToClipboard: true,
        },
        generateCreditCardMaskReceiptItem(maskedCardNumber4Digits),
        generateAmountReceiptItem(parseFloat(totalAmount)),
      ]),
      transaction: {
        isSuccess: summaryCode === '0',
        errorMessage: responseDescription,
      },
      submissionResult: this.formSubmissionResult,
    }
  }
}

/**
 * Get the QuickStream configuration needed to render the card form for a
 * payment session.
 */
export async function getPaymentFormConfiguration({
  session,
  abortSignal,
}: {
  session: PaymentFormSession
  abortSignal: AbortSignal
}): Promise<{
  supplierBusinessCode: string
  publishableApiKey: string
  isTestMode: boolean
}> {
  const { supplierBusinessCode, publishableApiKey, isTestMode } =
    await getCustomFormPaymentConfiguration<{
      supplierBusinessCode: string
      publishableApiKey: string
      isTestMode: boolean
    }>(
      `/forms/${session.formId}/westpac-quick-stream-payment/${session.formSubmissionPaymentId}`,
      {
        integrationEnvironmentId: session.integrationEnvironmentId,
      },
      abortSignal,
    )

  return {
    supplierBusinessCode,
    publishableApiKey,
    isTestMode,
  }
}

/**
 * Complete the QuickStream transaction for a payment session.
 *
 * `recaptcha` is required for payments started from a form submission and
 * omitted for payments started from an approval step.
 */
export async function completeTransaction({
  session,
  singleUseTokenId,
  recaptcha,
  abortSignal,
}: {
  session: PaymentFormSession
  singleUseTokenId: string
  recaptcha?: {
    siteKey: string
    token: string
  }
  abortSignal?: AbortSignal
}): Promise<{
  formSubmissionPayment: SubmissionTypes.FormSubmissionPayment
}> {
  const { formSubmissionPayment } = await completeWestpacQuickStreamTransaction(
    session.formId,
    {
      formSubmissionPaymentId: session.formSubmissionPaymentId,
      singleUseTokenId,
      integrationEnvironmentId: session.integrationEnvironmentId,
      customerReferenceNumber: session.customerReferenceNumber,
      principalAmount: session.amount,
      recaptcha,
    },
    abortSignal,
  )

  return {
    formSubmissionPayment,
  }
}

/** Cancel the QuickStream payment for a payment session. */
export async function cancelPayment({
  session,
  abortSignal,
}: {
  session: PaymentFormSession
  abortSignal?: AbortSignal
}): Promise<void> {
  await cancelWestpacQuickStreamPayment(
    session.formId,
    session.formSubmissionPaymentId,
    abortSignal,
  )
}

/**
 * Get the receipt URL for a completed QuickStream transaction. The receipt page
 * verifies the transaction using the query parameters added here.
 */
export function getCompletedPaymentReceiptUrl({
  formSubmissionResult,
  formSubmissionPayment,
}: {
  formSubmissionResult: FormSubmissionResult
  formSubmissionPayment: SubmissionTypes.FormSubmissionPayment
}): string {
  if (!formSubmissionResult.payment) {
    throw new Error(
      '"formSubmissionResult.payment" must have a value to create a receipt URL',
    )
  }

  const url = new URL(formSubmissionResult.payment.paymentReceiptUrl)
  if (
    formSubmissionPayment.type === 'WESTPAC_QUICK_STREAM' &&
    formSubmissionPayment.paymentTransaction
  ) {
    url.searchParams.append(
      'paymentReferenceNumber',
      formSubmissionPayment.paymentTransaction.paymentReferenceNumber,
    )
    url.searchParams.append(
      'receiptNumber',
      formSubmissionPayment.paymentTransaction.receiptNumber,
    )
    url.searchParams.append(
      'totalAmount',
      formSubmissionPayment.paymentTransaction.totalAmount.amount.toString(),
    )
    url.searchParams.append(
      'summaryCode',
      formSubmissionPayment.paymentTransaction.summaryCode,
    )
    url.searchParams.append(
      'responseDescription',
      formSubmissionPayment.paymentTransaction.responseDescription,
    )
    if (
      formSubmissionPayment.paymentTransaction.creditCard
        ?.maskedCardNumber4Digits
    ) {
      url.searchParams.append(
        'maskedCardNumber4Digits',
        formSubmissionPayment.paymentTransaction.creditCard
          ?.maskedCardNumber4Digits,
      )
    }
  }

  return url.href
}

/** Get the receipt URL for a cancelled QuickStream payment. */
export function getCancelledPaymentReceiptUrl(
  formSubmissionResult: FormSubmissionResult,
  formSubmissionPaymentId: string,
): string {
  if (!formSubmissionResult.payment) {
    throw new Error(
      '"formSubmissionResult.payment" must have a value to create a receipt URL',
    )
  }

  const url = new URL(formSubmissionResult.payment.paymentReceiptUrl)
  if (formSubmissionResult.submissionId) {
    url.searchParams.append(
      'paymentReferenceNumber',
      formSubmissionResult.submissionId,
    )
  }
  url.searchParams.append('receiptNumber', formSubmissionPaymentId)
  url.searchParams.append(
    'totalAmount',
    formSubmissionResult.payment.amount.toString(),
  )
  url.searchParams.append('summaryCode', '1')
  url.searchParams.append('responseDescription', 'Payment Cancelled')

  return url.href
}
