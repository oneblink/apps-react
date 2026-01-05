import { generateSchedulingConfiguration } from './api/scheduling'
import utilsService from './utils'
import { SubmissionEventTypes } from '@oneblink/types'
import { schedulingService } from '@oneblink/sdk-core'
import {
  FormSubmissionResult,
  BaseNewFormSubmission,
} from '../types/submissions'
import { SchedulingUrlConfiguration } from '../types/scheduling'

const SCHEDULING_SUBMISSION_RESULT_KEY = 'SCHEDULING_SUBMISSION_RESULT'
type SchedulingSubmissionResult = {
  formSubmissionResult: FormSubmissionResult
  paymentReceiptUrl: string | undefined
  paymentFormUrl: string | undefined
  preventPayment: boolean
}
export async function getSchedulingSubmissionResult(): Promise<SchedulingSubmissionResult | null> {
  return await utilsService.getLocalForageItem(SCHEDULING_SUBMISSION_RESULT_KEY)
}
export async function removeSchedulingSubmissionResult() {
  await utilsService.removeLocalForageItem(SCHEDULING_SUBMISSION_RESULT_KEY)
}
async function setSchedulingSubmissionResult(
  schedulingSubmissionResult: SchedulingSubmissionResult,
) {
  await utilsService.setLocalForageItem(
    SCHEDULING_SUBMISSION_RESULT_KEY,
    schedulingSubmissionResult,
  )
}

const SCHEDULING_BOOKING_KEY = 'SCHEDULING_BOOKING'
type SchedulingBooking = {
  /** The unique identifier for the submission associated with the booking */
  submissionId: string
  /** Date and time the booking starts */
  startTime: Date
  /** Date and time the booking ends */
  endTime: Date
  /** Location of booking */
  location: string | undefined
  /** `true` if the booking has been rescheduled, otherwise `false` */
  isReschedule: boolean
}

async function getSchedulingBookingMap() {
  return await utilsService.getLocalForageItem<
    Record<string, SchedulingBooking>
  >(SCHEDULING_BOOKING_KEY)
}

async function setSchedulingBookingMap(
  schedulingBookingMap: Record<string, SchedulingBooking>,
) {
  await utilsService.setLocalForageItem(
    SCHEDULING_BOOKING_KEY,
    schedulingBookingMap,
  )
}

export async function getSchedulingBooking(
  submissionId: string | null,
): Promise<SchedulingBooking | undefined> {
  if (!submissionId) {
    return
  }
  const schedulingBookingMap = await getSchedulingBookingMap()
  return schedulingBookingMap?.[submissionId]
}

export async function removeSchedulingBooking(submissionId: string) {
  const schedulingBookingMap = await getSchedulingBookingMap()
  if (schedulingBookingMap?.[submissionId]) {
    delete schedulingBookingMap[submissionId]
    await setSchedulingBookingMap(schedulingBookingMap)
  }
}

export async function setSchedulingBooking(
  schedulingBooking: SchedulingBooking,
) {
  const schedulingBookingMap = (await getSchedulingBookingMap()) || {}
  schedulingBookingMap[schedulingBooking.submissionId] = schedulingBooking
  await setSchedulingBookingMap(schedulingBookingMap)
}

function checkForSchedulingSubmissionEvent(
  baseFormSubmission: BaseNewFormSubmission,
): SubmissionEventTypes.FormSchedulingEvent | undefined {
  const schedulingSubmissionEvent = schedulingService.checkForSchedulingEvent(
    baseFormSubmission.definition,
    baseFormSubmission.submission,
  )
  if (schedulingSubmissionEvent) {
    console.log(
      'Form has a scheduling submission event',
      schedulingSubmissionEvent,
    )
  }
  return schedulingSubmissionEvent
}

async function handleSchedulingSubmissionEvent({
  formSubmissionResult,
  schedulingSubmissionEvent,
  schedulingUrlConfiguration,
  paymentReceiptUrl,
  paymentFormUrl,
  preventPayment,
}: {
  formSubmissionResult: FormSubmissionResult
  schedulingSubmissionEvent: SubmissionEventTypes.FormSchedulingEvent
  schedulingUrlConfiguration: SchedulingUrlConfiguration
  paymentReceiptUrl: string | undefined
  paymentFormUrl: string | undefined
  preventPayment: boolean
}): Promise<NonNullable<FormSubmissionResult['scheduling']>> {
  console.log(
    'Attempting to handle submission with scheduling submission event',
  )
  if (!formSubmissionResult.submissionId) {
    throw Error(
      'Cannot generate calendar booking configuration.  Form Submission is missing "submissionId"',
    )
  }

  await generateSchedulingConfiguration({
    formSubmissionResult,
    schedulingSubmissionEvent,
    schedulingUrlConfiguration,
  })

  const bookingUrl = new URL(schedulingUrlConfiguration.schedulingBookingUrl)
  bookingUrl.searchParams.set('submissionId', formSubmissionResult.submissionId)

  const scheduling = {
    submissionEvent: schedulingSubmissionEvent,
    bookingUrl: bookingUrl.toString(),
  }
  console.log('Created scheduling configuration to start booking', scheduling)
  await setSchedulingSubmissionResult({
    formSubmissionResult: {
      ...formSubmissionResult,
      scheduling,
    },
    paymentReceiptUrl,
    paymentFormUrl,
    preventPayment,
  })

  return scheduling
}

export {
  SchedulingBooking,
  checkForSchedulingSubmissionEvent,
  handleSchedulingSubmissionEvent,
}
