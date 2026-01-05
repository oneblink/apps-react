import { SubmissionEventTypes } from '@oneblink/types'
import { FormSubmissionResult } from './submissions'
import { SchedulingBooking } from '../scheduling-service'

export type PaymentReceiptItem = {
  /** The label to represent the value */
  label: string
  /** The value to display */
  value: string
  /** A CSS class to add to the HTML element container */
  className?: string
  /** A CSS class to add to the HTML element containing the value */
  valueClassName?: string
  /** A [material icon](https://fonts.google.com/icons) */
  icon?: string
  /** Display a button on the receipt item to copy the value to the clipboard */
  allowCopyToClipboard: boolean
}

export type VerifiedPaymentTransaction = {
  receiptItems: PaymentReceiptItem[]
  transaction: {
    /** `true` if the transaction was successful */
    isSuccess: boolean
    /** The error message to display if `isSuccess` is `false` */
    errorMessage: string | undefined | null
  }
  submissionResult: FormSubmissionResult
}

export type HandlePaymentResult = VerifiedPaymentTransaction & {
  schedulingBooking: SchedulingBooking | undefined
}

export type BasePaymentConfigurationPayload = {
  amount: number
  redirectUrl: string
  submissionId: string | null
  paymentFormUrl?: string
}

export interface PaymentProvider<
  T extends SubmissionEventTypes.FormPaymentEvent,
> {
  formSubmissionResult: FormSubmissionResult
  paymentSubmissionEvent: T

  preparePaymentConfiguration(basePayload: BasePaymentConfigurationPayload): {
    path: string
    payload: BasePaymentConfigurationPayload
  }

  verifyPaymentTransaction(
    query: Record<string, unknown>,
  ): Promise<VerifiedPaymentTransaction>
}
