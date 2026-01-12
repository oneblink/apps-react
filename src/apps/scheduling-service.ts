import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { createNylasExistingBookingSession } from './services/api/scheduling'
import {
  checkForPaymentSubmissionEvent,
  handlePaymentSubmissionEvent,
} from './payment-service'
import { FormSubmissionResult } from './types/submissions'
import {
  SchedulingBooking,
  getSchedulingSubmissionResult,
  removeSchedulingSubmissionResult,
  setSchedulingBooking,
} from './services/schedulingHandlers'

async function getPaymentConfiguration({
  paymentReceiptUrl,
  paymentFormUrl,
  preventPayment,
  formSubmissionResult,
  schedulingBooking,
}: {
  paymentReceiptUrl: string | undefined
  paymentFormUrl: string | undefined
  preventPayment: boolean
  formSubmissionResult: FormSubmissionResult
  schedulingBooking: SchedulingBooking
}) {
  if (preventPayment || !paymentReceiptUrl) {
    return null
  }

  await setSchedulingBooking(schedulingBooking)
  const paymentSubmissionEventConfiguration =
    checkForPaymentSubmissionEvent(formSubmissionResult)
  if (paymentSubmissionEventConfiguration) {
    return await handlePaymentSubmissionEvent({
      ...paymentSubmissionEventConfiguration,
      formSubmissionResult,
      paymentReceiptUrl,
      paymentFormUrl,
    })
  }

  return null
}

async function getSchedulingFormSubmissionResult(
  submissionId: string,
  schedulingBooking: SchedulingBooking,
) {
  const schedulingSubmissionResultConfiguration =
    await getSchedulingSubmissionResult()
  // If the current transaction does not match the submission
  // we will display message to user indicating
  // they are looking for the wrong transaction receipt.
  if (!schedulingSubmissionResultConfiguration) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a scheduling receipt for an unknown booking.',
    )
  }

  const {
    formSubmissionResult,
    paymentReceiptUrl,
    paymentFormUrl,
    preventPayment,
  } = schedulingSubmissionResultConfiguration
  if (
    !formSubmissionResult ||
    !formSubmissionResult.scheduling ||
    !formSubmissionResult.scheduling.submissionEvent
  ) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a scheduling receipt for a misconfigured booking.',
    )
  }

  if (formSubmissionResult.submissionId !== submissionId) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a scheduling receipt for the incorrect booking.',
    )
  }

  formSubmissionResult.payment = await getPaymentConfiguration({
    paymentFormUrl,
    paymentReceiptUrl,
    preventPayment,
    formSubmissionResult,
    schedulingBooking,
  })

  await removeSchedulingSubmissionResult()

  return formSubmissionResult
}

/**
 * Pass in query string parameters after a redirect back to your app after a
 * booking is processed. Will return a SchedulingBooking and the submission
 * result from the original submission before redirecting to
 * `scheduling.bookingUrl`. If the booking has been rescheduled, the submission
 * result will not be returned.
 *
 * #### Example
 *
 * ```js
 * import queryString from 'query-string'
 *
 * const query = queryString.parse(window.location.search)
 *
 * const { booking, formSubmissionResult } =
 *   await schedulingService.handleSchedulingQuerystring(query)
 * ```
 *
 * @param options
 * @returns
 */
async function handleSchedulingQuerystring({
  start_time,
  end_time,
  location,
  submissionId,
  isReschedule,
}: Record<string, unknown>): Promise<{
  booking: SchedulingBooking
  formSubmissionResult?: FormSubmissionResult
}> {
  if (
    typeof submissionId !== 'string' ||
    typeof start_time !== 'string' ||
    typeof end_time !== 'string' ||
    typeof location !== 'string'
  ) {
    throw new OneBlinkAppsError(
      'Scheduling receipts cannot be displayed unless navigating here directly after a booking.',
    )
  }
  const booking: SchedulingBooking = {
    submissionId,
    startTime: new Date(parseInt(start_time) * 1000),
    endTime: new Date(parseInt(end_time) * 1000),
    location,
    isReschedule: isReschedule === 'true',
  }
  console.log('Parsed booking result', booking)

  if (isReschedule) {
    return {
      booking,
    }
  }

  const formSubmissionResult = await getSchedulingFormSubmissionResult(
    submissionId,
    booking,
  )

  return {
    formSubmissionResult,
    booking,
  }
}

/**
 * Pass in query string parameters after navigation to your app via a valid
 * cancellation link.
 *
 * #### Example
 *
 * ```js
 * import queryString from 'query-string'
 *
 * const query = queryString.parse(window.location.search)
 *
 * const bookingToCancel =
 *   await schedulingService.handleCancelSchedulingBookingQuerystring(query)
 * ```
 *
 * @param options
 * @returns
 */
function handleCancelSchedulingBookingQuerystring({
  nylasEditHash,
  submissionId,
  startTime,
  endTime,
  eventName,
  location,
  timezone,
  cancellationPolicy,
}: Record<string, unknown>): {
  /** The nylas edit hash associated with the booking */
  nylasEditHash: string
  /** The unique identifier for the submission associated with the booking */
  submissionId: string
  /** The start time of the booking */
  startTime: Date
  /** The end time of the booking */
  endTime: Date
  /** The event name */
  eventName: string
  /** The location of the event */
  location: string
  /** The timezone the booking was booked in */
  timezone: string
  /**
   * The policy to display to users when asked why they are cancelling the
   * booking
   */
  cancellationPolicy?: string
} {
  if (
    typeof submissionId !== 'string' ||
    typeof nylasEditHash !== 'string' ||
    typeof startTime !== 'string' ||
    typeof endTime !== 'string' ||
    typeof eventName !== 'string' ||
    typeof location !== 'string' ||
    typeof timezone !== 'string' ||
    (typeof cancellationPolicy !== 'string' && cancellationPolicy !== undefined)
  ) {
    throw new OneBlinkAppsError(
      'Scheduling bookings cannot be cancelled unless navigating here from the correct link.',
    )
  }

  const booking = {
    nylasEditHash,
    submissionId,
    startTime: new Date(parseInt(startTime) * 1000),
    endTime: new Date(parseInt(endTime) * 1000),
    eventName,
    location,
    timezone,
    cancellationPolicy,
  }
  console.log('Parsed scheduling booking cancel data', booking)

  return booking
}

/**
 * Create a Nylas Session
 *
 * #### Example
 *
 * ```js
 * const {
 *   sessionId,
 *   configurationId,
 *   bookingRef,
 *   name,
 *   email,
 *   formSubmissionResult,
 * } = await schedulingService.createNylasNewBookingSession(
 *   '89c6e98e-f56f-45fc-84fe-c4fc62331d34',
 * )
 * // use sessionId and configurationId/bookingRef to create or modify nylas bookings
 * // use formSubmissionResult to execute post submission action for form
 * ```
 *
 * @param submissionId
 * @param abortSignal
 * @returns
 */
async function createNylasNewBookingSession(
  submissionId: string,
  abortSignal: AbortSignal,
): Promise<
  Awaited<ReturnType<typeof createNylasExistingBookingSession>> & {
    /**
     * A callback function run after the booking has been confirmed to prevent
     * the user from making another booking against this form submission and
     * execute post submission action.
     */
    onBookingConfirmed: (
      schedulingBooking: SchedulingBooking,
    ) => Promise<FormSubmissionResult>
  }
> {
  const session = await createNylasExistingBookingSession(
    submissionId,
    abortSignal,
  )

  return {
    ...session,
    async onBookingConfirmed(schedulingBooking: SchedulingBooking) {
      return await getSchedulingFormSubmissionResult(
        submissionId,
        schedulingBooking,
      )
    },
  }
}

export {
  SchedulingBooking,
  handleSchedulingQuerystring,
  handleCancelSchedulingBookingQuerystring,
  createNylasExistingBookingSession,
  createNylasNewBookingSession,
  getSchedulingFormSubmissionResult,
}
