import { paymentService } from '@oneblink/sdk-core'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { createPaymentConfiguration } from './services/api/payment'
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
import {
  addDaysToDate,
  endOfDay,
  parseDayOnlyDate,
  startOfDay,
  replaceSubmissionFormatters,
} from './localisation-service'
import {
  getPaymentFormSession,
  getPaymentHandoff,
  paymentProviderRendersInApp,
  type InAppPaymentType,
  type PaymentFormSession,
} from './services/payment-handoff'
import {
  getSchedulingBooking,
  removeSchedulingBooking,
} from './services/schedulingHandlers'
import {
  retrieveFormSubmissionResult,
  rememberPaymentSubmissionResult,
} from './services/payment-submission-result'

export { HandlePaymentResult, PaymentReceiptItem, westpacQuickStream }
export { paymentProviderRendersInApp, getPaymentHandoff, getPaymentFormSession }
export type { InAppPaymentType, PaymentFormSession }

/**
 * Receipt URLs for providers whose payment form is rendered by the app. Add a
 * new in-app provider here so hosts of that form can redirect to a receipt
 * without knowing which provider took the payment.
 */
function getInAppPaymentReceipts(formSubmissionResult: FormSubmissionResult) {
  const paymentType = formSubmissionResult.payment?.submissionEvent.type
  if (!paymentType || !paymentProviderRendersInApp(paymentType)) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a receipt for an unsupported payment.',
    )
  }

  switch (paymentType) {
    case 'WESTPAC_QUICK_STREAM': {
      return westpacQuickStream
    }
    default: {
      const unsupportedPaymentType: never = paymentType
      throw new OneBlinkAppsError(
        `It looks like you are attempting to view a receipt for an unsupported payment (${unsupportedPaymentType}).`,
      )
    }
  }
}

/**
 * Get the receipt URL for a completed in-app payment. The receipt page verifies
 * the transaction from the query parameters on this URL.
 *
 * @param options
 * @returns
 */
export function getCompletedPaymentReceiptUrl(options: {
  formSubmissionResult: FormSubmissionResult
  formSubmissionPayment: SubmissionTypes.FormSubmissionPayment
}): string {
  return getInAppPaymentReceipts(
    options.formSubmissionResult,
  ).getCompletedPaymentReceiptUrl(options)
}

/**
 * Get the receipt URL for a cancelled in-app payment.
 *
 * @param formSubmissionResult
 * @param formSubmissionPaymentId
 * @returns
 */
export function getCancelledPaymentReceiptUrl(
  formSubmissionResult: FormSubmissionResult,
  formSubmissionPaymentId: string,
): string {
  return getInAppPaymentReceipts(
    formSubmissionResult,
  ).getCancelledPaymentReceiptUrl(formSubmissionResult, formSubmissionPaymentId)
}

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
  const submissionResult = await retrieveFormSubmissionResult()
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

export function checkForPaymentSubmissionEvent(
  formSubmission: FormSubmission,
  submissionTimestamp: string,
): SubmissionEventTypes.FormPaymentEvent | undefined {
  const result = paymentService.checkForPaymentEvent({
    definition: formSubmission.definition,
    submission: formSubmission.submission,
    submissionTimestamp,
    parseDayOnlyDate,
    addDaysToDate,
    startOfDay,
    endOfDay,
  })
  if (result) {
    console.log('Form has a payment submission event with amount', result)
    return result.paymentSubmissionEvent
  }
  return undefined
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
  formSubmissionResult,
  paymentReceiptUrl,
  paymentFormUrl,
}: {
  formSubmissionResult: FormSubmissionResult
  paymentReceiptUrl: string
  paymentFormUrl: string | undefined
}): Promise<FormSubmissionResult['payment']> {
  if (!formSubmissionResult.submissionId) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to make a payment for an unknown submission.',
    )
  }
  const paymentConfiguration = await createPaymentConfiguration(
    formSubmissionResult.submissionId,
    { redirectUrl: paymentReceiptUrl, paymentFormUrl },
  )

  if (!paymentConfiguration) {
    await rememberPaymentSubmissionResult({
      ...formSubmissionResult,
      scheduling: null,
      payment: null,
    })
    return null
  }

  const payment = {
    submissionEvent: paymentConfiguration.paymentSubmissionEvent,
    paymentReceiptUrl,
    hostedFormUrl: paymentConfiguration.hostedFormUrl,
    paymentFormUrl,
    amount: paymentConfiguration.amount,
  }
  console.log('Created Payment configuration to start transaction', payment)

  await rememberPaymentSubmissionResult({
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
  const formSubmissionResult = await retrieveFormSubmissionResult()

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

/**
 * Retrieve the failure message and provider response fields for a form
 * submission payment. Returns an empty array unless the payment failed.
 *
 * #### Example
 *
 * ```js
 * const failureDetails =
 *   paymentService.getFailureDetailsFromFormSubmissionPayment(
 *     formSubmissionPayment,
 *   )
 * ```
 *
 * @param formSubmissionPayment
 * @returns
 */
export function getFailureDetailsFromFormSubmissionPayment(
  formSubmissionPayment: SubmissionTypes.FormSubmissionPayment,
) {
  return paymentService.getFailureDetailsFromFormSubmissionPayment(
    formSubmissionPayment,
  )
}
