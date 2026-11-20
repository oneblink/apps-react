import { paymentService } from '@oneblink/sdk-core'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { createPaymentConfiguration } from './services/api/payment'
import {
  FormTypes,
  SubmissionEventTypes,
  SubmissionTypes,
} from '@oneblink/types'
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
import {
  fetchJSON,
  generateHeaders,
  HTTPError,
  postRequest,
} from './services/fetch'
import tenants from './tenants'

export { HandlePaymentResult, PaymentReceiptItem, westpacQuickStream }
export { paymentProviderRendersInApp, getPaymentHandoff, getPaymentFormSession }
export { rememberPaymentSubmissionResult }
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

const paymentRequestConflictMessages = {
  PAYMENT_REQUEST_NOT_FOUND: 'This payment link is not valid.',
  PAYMENT_REQUEST_ALREADY_PAID: 'This payment has already been completed.',
  PAYMENT_REQUEST_SKIPPED:
    'This payment was skipped, so there is nothing to pay.',
  PAYMENT_REQUEST_DENIED: 'This payment was denied and can no longer be paid.',
  PAYMENT_REQUEST_CLARIFICATION_REQUIRED:
    'This submission was sent back for clarification, so this payment link can no longer be used.',
  PAYMENT_REQUEST_SUBMISSION_REMOVED:
    'The submission for this payment has been removed, so it can no longer be paid.',
  PAYMENT_REQUEST_UNAVAILABLE: 'This payment request is no longer available.',
  PAYMENT_IN_PROGRESS:
    'A payment is already in progress for this step. Finish that payment before starting another.',
} as const

function paymentRequestConflictMessage(
  conflict: string | undefined,
): string | undefined {
  switch (conflict) {
    case 'PAYMENT_REQUEST_NOT_FOUND': {
      return paymentRequestConflictMessages.PAYMENT_REQUEST_NOT_FOUND
    }
    case 'PAYMENT_REQUEST_ALREADY_PAID': {
      return paymentRequestConflictMessages.PAYMENT_REQUEST_ALREADY_PAID
    }
    case 'PAYMENT_REQUEST_SKIPPED': {
      return paymentRequestConflictMessages.PAYMENT_REQUEST_SKIPPED
    }
    case 'PAYMENT_REQUEST_DENIED': {
      return paymentRequestConflictMessages.PAYMENT_REQUEST_DENIED
    }
    case 'PAYMENT_REQUEST_CLARIFICATION_REQUIRED': {
      return paymentRequestConflictMessages.PAYMENT_REQUEST_CLARIFICATION_REQUIRED
    }
    case 'PAYMENT_REQUEST_SUBMISSION_REMOVED': {
      return paymentRequestConflictMessages.PAYMENT_REQUEST_SUBMISSION_REMOVED
    }
    case 'PAYMENT_REQUEST_UNAVAILABLE': {
      return paymentRequestConflictMessages.PAYMENT_REQUEST_UNAVAILABLE
    }
    case 'PAYMENT_IN_PROGRESS': {
      return paymentRequestConflictMessages.PAYMENT_IN_PROGRESS
    }
    default: {
      return undefined
    }
  }
}

function throwPaymentRequestError(error: unknown): never {
  if (error instanceof OneBlinkAppsError) {
    throw error
  }
  if (error instanceof HTTPError) {
    throw new OneBlinkAppsError(
      paymentRequestConflictMessage(error.conflict) ??
        (error.status === 409
          ? paymentRequestConflictMessages.PAYMENT_REQUEST_UNAVAILABLE
          : error.message ||
            paymentRequestConflictMessages.PAYMENT_REQUEST_UNAVAILABLE),
      {
        httpStatusCode: error.status,
        conflict: error.conflict,
        requiresLogin: error.status === 401,
      },
    )
  }
  throw new OneBlinkAppsError(
    error instanceof Error && error.message
      ? error.message
      : paymentRequestConflictMessages.PAYMENT_REQUEST_UNAVAILABLE,
  )
}

export type FormSubmissionPaymentReview = {
  form: FormTypes.Form
  submission: SubmissionTypes.S3SubmissionData['submission']
  submissionId: string
  task?: SubmissionTypes.S3SubmissionData['task']
  taskGroup?: SubmissionTypes.S3SubmissionData['taskGroup']
  taskGroupInstance?: SubmissionTypes.S3SubmissionData['taskGroupInstance']
}

/**
 * Load the latest submission for a payment request. The token is the secret
 * from the review link and is not stored by the client beyond this call. Throws
 * an `OneBlinkAppsError` when the link can no longer be used.
 */
export async function reviewFormSubmissionPaymentRequest(
  paymentRequestToken: string,
  abortSignal?: AbortSignal,
): Promise<FormSubmissionPaymentReview> {
  if (!paymentRequestToken) {
    throw new OneBlinkAppsError(
      paymentRequestConflictMessages.PAYMENT_REQUEST_NOT_FOUND,
    )
  }
  try {
    // Goes through `/storage` so that Lambda@Edge asks the API where the
    // submission is stored. The submission itself is then read from S3 through
    // the payment review Object Lambda, so it does not pass through the API or
    // the load balancer. The viewer request is a GET because Lambda@Edge
    // cannot change the HTTP method, and S3 rejects a POST. The payment token
    // travels in `x-oneblink-request-body`. The bearer token is forwarded so
    // the API can confirm a private form is being reviewed by its submitter.
    const headers = await generateHeaders()
    headers['x-oneblink-request-body'] = JSON.stringify({
      paymentRequestToken,
    })
    return await fetchJSON<FormSubmissionPaymentReview>(
      `${tenants.current.apiOrigin}/storage/form-submission-payment-requests/review`,
      {
        method: 'GET',
        headers,
        signal: abortSignal,
      },
    )
  } catch (error) {
    throwPaymentRequestError(error)
  }
}

/**
 * Start checkout for a payment request and store the result for the receipt
 * page. The hosted payment URL is built by the server from the submission's
 * forms app.
 *
 * #### Example
 *
 * ```js
 * const payment = await paymentService.startFormSubmissionPaymentRequest(
 *   paymentRequestToken,
 *   {
 *     form,
 *     submission,
 *     submissionId: '89c6e98e-f56f-45fc-84fe-c4fc62331d34',
 *     paymentReceiptUrl: `${window.location.origin}/payment-receipt`,
 *     paymentFormUrl: `${window.location.origin}/payment-form`,
 *   },
 * )
 * ```
 *
 * @param paymentRequestToken The secret from the review link.
 * @param options
 * @param options.form The form definition returned by the review.
 * @param options.submission The submission returned by the review.
 * @param options.submissionId The submission this payment belongs to.
 * @param options.paymentReceiptUrl The URL the payment provider redirects to
 *   when the payment finishes.
 * @param options.paymentFormUrl The in-app payment page. Required for providers
 *   that render their payment form in the app.
 * @returns
 * @throws {OneBlinkAppsError} When the payment request can no longer be paid.
 */
export async function startFormSubmissionPaymentRequest(
  paymentRequestToken: string,
  options: {
    form: FormTypes.Form
    submission: SubmissionTypes.S3SubmissionData['submission']
    submissionId: string
    paymentReceiptUrl: string
    paymentFormUrl?: string
  },
): Promise<{
  hostedFormUrl: string
  amount: number
  paymentSubmissionEvent: SubmissionEventTypes.FormPaymentEvent
  customerReferenceNumber?: string
}> {
  let result: {
    hostedFormUrl: string
    amount: number
    paymentSubmissionEvent: SubmissionEventTypes.FormPaymentEvent
    customerReferenceNumber?: string
  }
  try {
    result = await postRequest(
      `${tenants.current.apiOrigin}/form-submission-payment-requests/start`,
      { paymentRequestToken },
    )
  } catch (error) {
    throwPaymentRequestError(error)
  }

  await rememberPaymentSubmissionResult({
    submission: options.submission,
    // The post-submission receipt is written for the original submitter.
    definition: {
      ...options.form,
      postSubmissionReceipt: undefined,
    },
    preFillFormDataId: null,
    submissionId: options.submissionId,
    submissionTimestamp: new Date().toISOString(),
    payment: {
      amount: result.amount,
      paymentReceiptUrl: options.paymentReceiptUrl,
      paymentFormUrl: options.paymentFormUrl,
      hostedFormUrl: result.hostedFormUrl,
      submissionEvent: result.paymentSubmissionEvent,
    },
    scheduling: null,
    isInPendingQueue: false,
    isOffline: false,
    isUploadingAttachments: false,
  })

  return result
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
