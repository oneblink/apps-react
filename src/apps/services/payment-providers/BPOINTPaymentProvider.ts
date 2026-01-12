import { SubmissionEventTypes } from '@oneblink/types'
import {
  BasePaymentConfigurationPayload,
  PaymentProvider,
} from '../../types/payments'
import { FormSubmissionResult } from '../../types/submissions'
import replaceInjectablesWithSubmissionValues from '../replaceInjectablesWithSubmissionValues'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import { verifyPaymentTransaction } from '../api/payment'
import {
  generateAmountReceiptItem,
  generateCreditCardMaskReceiptItem,
  generateSubmissionIdReceiptItem,
  prepareReceiptItems,
} from './receipt-items'

class BPOINTPaymentProvider
  implements PaymentProvider<SubmissionEventTypes.BPOINTSubmissionEvent>
{
  constructor(
    paymentSubmissionEvent: SubmissionEventTypes.BPOINTSubmissionEvent,
    formSubmissionResult: FormSubmissionResult,
  ) {
    this.paymentSubmissionEvent = paymentSubmissionEvent
    this.formSubmissionResult = formSubmissionResult
  }

  paymentSubmissionEvent: SubmissionEventTypes.BPOINTSubmissionEvent
  formSubmissionResult: FormSubmissionResult

  preparePaymentConfiguration(basePayload: BasePaymentConfigurationPayload) {
    return {
      path: `/forms/${this.formSubmissionResult.definition.id}/bpoint-payment`,
      payload: {
        ...basePayload,
        integrationEnvironmentId:
          this.paymentSubmissionEvent.configuration.environmentId,
        crn2:
          this.paymentSubmissionEvent.configuration.crn2 &&
          replaceInjectablesWithSubmissionValues(
            this.paymentSubmissionEvent.configuration.crn2,
            this.formSubmissionResult,
          ).text,
        crn3:
          this.paymentSubmissionEvent.configuration.crn3 &&
          replaceInjectablesWithSubmissionValues(
            this.paymentSubmissionEvent.configuration.crn3,
            this.formSubmissionResult,
          ).text,
      },
    }
  }

  async verifyPaymentTransaction(query: Record<string, unknown>) {
    const { ResultKey: transactionToken } = query
    if (!transactionToken) {
      throw new OneBlinkAppsError(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
    }
    const transaction = await verifyPaymentTransaction<{
      ResponseCode: string
      ResponseText: string
      ReceiptNumber: string
      CardDetails?: {
        MaskedCardNumber?: string
      }
      Amount: number
      Crn1: string | null
    }>(
      `/forms/${this.formSubmissionResult.definition.id}/bpoint-verification`,
      {
        transactionToken,
        integrationEnvironmentId:
          this.paymentSubmissionEvent.configuration.environmentId,
      },
    )
    if (this.formSubmissionResult.submissionId !== transaction.Crn1) {
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
          value: transaction.ReceiptNumber,
          allowCopyToClipboard: true,
        },
        generateCreditCardMaskReceiptItem(
          transaction.CardDetails?.MaskedCardNumber,
        ),
        generateAmountReceiptItem(transaction.Amount / 100),
      ]),
      transaction: {
        isSuccess: transaction.ResponseCode === '0',
        errorMessage: transaction.ResponseText,
      },
      submissionResult: this.formSubmissionResult,
    }
  }
}

export default BPOINTPaymentProvider
