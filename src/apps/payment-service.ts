import { paymentService } from '@oneblink/sdk-core'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { generatePaymentConfiguration } from './services/api/payment'
import utilsService from './services/utils'
import { SubmissionEventTypes, SubmissionTypes } from '@oneblink/types'
import { FormSubmission, FormSubmissionResult } from './types/submissions'
import {
  HandlePaymentResult,
  PaymentProvider,
  PaymentReceiptItem,
} from './types/payments'
import BPOINTPaymentProvider from './services/payment-providers/BPOINTPaymentProvider'
import CPPayPaymentProvider from './services/payment-providers/CPPayPaymentProvider'
import NSWGovPayPaymentProvider from './services/payment-providers/NSWGovPayPaymentProvider'
import WestpacQuickStreamPaymentProvider, * as westpacQuickStream from './services/payment-providers/WestpacQuickStreamPaymentProvider'
import { replaceSubmissionFormatters } from './localisation-service'
import {
  getSchedulingBooking,
  removeSchedulingBooking,
} from './services/schedulingHandlers'

const KEY = 'PAYMENT_SUBMISSION_RESULT'

export { HandlePaymentResult, PaymentReceiptItem, westpacQuickStream }

function getPaymentProvider(
  formSubmissionResult: FormSubmissionResult,
  paymentSubmissionEvent: SubmissionEventTypes.FormPaymentEvent,
): PaymentProvider<SubmissionEventTypes.FormPaymentEvent> {
  switch (paymentSubmissionEvent.type) {
    case 'BPOINT': {
      return new BPOINTPaymentProvider(
        paymentSubmissionEvent,
        formSubmissionResult,
      )
    }
    case 'CP_PAY': {
      return new CPPayPaymentProvider(
        paymentSubmissionEvent,
        formSubmissionResult,
      )
    }
    case 'NSW_GOV_PAY': {
      return new NSWGovPayPaymentProvider(
        paymentSubmissionEvent,
        formSubmissionResult,
      )
    }
    case 'WESTPAC_QUICK_STREAM': {
      return new WestpacQuickStreamPaymentProvider(
        paymentSubmissionEvent,
        formSubmissionResult,
      )
    }
  }
}

/**
 * Pass in query string parameters after a redirect back to your app after a
 * payment is processed. This function will handle all payment submission events
 * supported by OneBlink. Will return a Transaction and the submission result
 * that was returned from `handlePaymentSubmissionEvent()` before redirecting to
 * `payment.hostedFormUrl`.
 *
 * #### Example
 *
 * ```js
 * import queryString from 'query-string'
 *
 * const query = queryString.parse(window.location.search)
 * const { transaction, submissionResult } =
 *   await paymentService.handlePaymentQuerystring(query)
 * ```
 *
 * @param query
 * @returns
 */
export async function handlePaymentQuerystring(
  query: Record<string, unknown>,
): Promise<HandlePaymentResult> {
  const submissionResult =
    await utilsService.getLocalForageItem<FormSubmissionResult | null>(KEY)
  // If the current transaction does not match the submission
  // we will display message to user indicating
  // they are looking for the wrong transaction receipt.
  if (!submissionResult) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a receipt for an unknown payment.',
    )
  }
  if (!submissionResult.payment || !submissionResult.payment.submissionEvent) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a receipt for a misconfigured payment.',
    )
  }
  const paymentProvider = getPaymentProvider(
    submissionResult,
    submissionResult.payment.submissionEvent,
  )
  if (!paymentProvider) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a receipt for an unsupported payment.',
    )
  }

  const verifiedPaymentTransaction =
    await paymentProvider.verifyPaymentTransaction(query)

  const schedulingBooking = await getSchedulingBooking(
    verifiedPaymentTransaction.submissionResult.submissionId,
  )
  if (schedulingBooking && verifiedPaymentTransaction.transaction.isSuccess) {
    await removeSchedulingBooking(schedulingBooking.submissionId)
  }

  return {
    ...verifiedPaymentTransaction,
    schedulingBooking,
  }
}

export function checkForPaymentSubmissionEvent(formSubmission: FormSubmission):
  | {
      paymentSubmissionEvent: SubmissionEventTypes.FormPaymentEvent
      amount: number
    }
  | undefined {
  const result = paymentService.checkForPaymentEvent(
    formSubmission.definition,
    formSubmission.submission,
  )
  if (result) {
    console.log('Form has a payment submission event with amount', result)
  }
  return result
}

/**
 * Handle a submission result with a payment submission event. Will throw an
 * error if a transaction has already been made using this submission result.
 * Will return `undefined` if the submission does not have an amount. Will
 * return the submission result passed in with a `payment` property if the
 * submission requires processing.
 *
 * #### Example
 *
 * ```js
 * const formSubmissionResult = {
 *   submissionId: '89c6e98e-f56f-45fc-84fe-c4fc62331d34',
 *   submissionTimestamp: '2020-07-29T01:03:26.573Z'
 *   formsAppId: 1,
 *   submission: {
 *     form: 'data',
 *     goes: 'here',
 *     amount: 1.50,
 *   }
 *   definition: OneBlinkForm,
 *   payment: null,
 * }
 * const paymentSubmissionEvent = {
 *   type: 'CP_PAY',
 *   configuration: {
 *     elementId: '12663efc-4c6a-4e72-8505-559edfe3e92e',
 *     gatewayId: '6658c5c4-e0db-483b-8af7-6a6464fe772c',
 *   },
 * }
 * const paymentReceiptUrl = `${window.location.origin}/payment-receipt`
 * const paymentSubmissionResult = await paymentService.handlePaymentSubmissionEvent({
 *   formSubmissionResult,
 *   paymentSubmissionEvent,
 *   paymentReceiptUrl,
 * })
 * if (paymentSubmissionResult) {
 *   window.location.href = paymentSubmissionResult.payment.hostedFormUrl
 * }
 * ```
 *
 * @param options
 * @returns
 */
export async function handlePaymentSubmissionEvent({
  amount,
  formSubmissionResult,
  paymentSubmissionEvent,
  paymentReceiptUrl,
  paymentFormUrl,
}: {
  amount: number
  formSubmissionResult: FormSubmissionResult
  paymentSubmissionEvent: SubmissionEventTypes.FormPaymentEvent
  paymentReceiptUrl: string
  paymentFormUrl: string | undefined
}): Promise<FormSubmissionResult['payment']> {
  const paymentProvider = getPaymentProvider(
    formSubmissionResult,
    paymentSubmissionEvent,
  )
  if (!paymentProvider) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to make a payment using an unsupported payment method.',
    )
  }

  const paymentConfiguration = await generatePaymentConfiguration(
    paymentProvider,
    {
      amount,
      redirectUrl: paymentReceiptUrl,
      submissionId: formSubmissionResult.submissionId,
      paymentFormUrl,
    },
  )

  const payment = {
    submissionEvent: paymentSubmissionEvent,
    paymentReceiptUrl,
    hostedFormUrl: paymentConfiguration.hostedFormUrl,
    paymentFormUrl,
    amount,
  }
  console.log('Created Payment configuration to start transaction', payment)

  await utilsService.setLocalForageItem(KEY, {
    ...formSubmissionResult,
    scheduling: null,
    payment,
  })

  return payment
}

export async function getFormSubmissionResultPayment(): Promise<{
  formSubmissionResult: FormSubmissionResult
  paymentSubmissionEvent: SubmissionEventTypes.FormPaymentEvent
}> {
  const formSubmissionResult =
    await utilsService.getLocalForageItem<FormSubmissionResult | null>(KEY)

  if (!formSubmissionResult) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to complete a transaction for an unknown payment.',
    )
  }
  if (!formSubmissionResult.payment?.submissionEvent) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to complete a transaction for a misconfigured payment.',
    )
  }

  return {
    formSubmissionResult,
    paymentSubmissionEvent: formSubmissionResult.payment?.submissionEvent,
  }
}

/**
 * Retrieve an array of detail items from a form submission payment.
 *
 * #### Example
 *
 * ```js
 * const detailItems =
 *   paymentService.getDisplayDetailsFromFormSubmissionPayment(
 *     formSubmissionPayment,
 *   )
 * ```
 *
 * @param formSubmissionPayment
 * @returns
 */
export function getDisplayDetailsFromFormSubmissionPayment(
  formSubmissionPayment: SubmissionTypes.FormSubmissionPayment,
) {
  return paymentService.getDisplayDetailsFromFormSubmissionPayment(
    formSubmissionPayment,
    replaceSubmissionFormatters,
  )
}
