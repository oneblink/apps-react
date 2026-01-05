import { SubmissionEventTypes } from '@oneblink/types'
import { HTTPError, postRequest } from '../fetch'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import tenants from '../../tenants'
import Sentry from '../../Sentry'
import { FormSubmissionResult } from '../../types/submissions'
import { submissionService } from '@oneblink/sdk-core'
import { SchedulingUrlConfiguration } from '../../types/scheduling'

function getBookingQuerystringValue(
  elementId: string | undefined,
  formSubmissionResult: FormSubmissionResult,
) {
  if (elementId) {
    const value = submissionService.getRootElementValueById(
      elementId,
      formSubmissionResult.definition.elements,
      formSubmissionResult.submission,
    )
    if (value && typeof value === 'string') {
      return value
    }
  }
}

async function startNylasBooking({
  formSubmissionResult,
  schedulingSubmissionEvent,
  schedulingCancelUrl,
  schedulingRescheduleUrl,
}: {
  formSubmissionResult: FormSubmissionResult
  schedulingSubmissionEvent: SubmissionEventTypes.NylasSubmissionEvent
  schedulingCancelUrl: string
  schedulingRescheduleUrl?: string
}): Promise<void> {
  const url = `${tenants.current.apiOrigin}/scheduling/nylas/start-booking`
  const body = {
    formId: formSubmissionResult.definition.id,
    nylasConfigurationId:
      schedulingSubmissionEvent.configuration.nylasConfigurationId,
    submissionId: formSubmissionResult.submissionId,
    schedulingCancelUrl,
    schedulingRescheduleUrl,
    name: getBookingQuerystringValue(
      schedulingSubmissionEvent.configuration.nameElementId,
      formSubmissionResult,
    ),
    email: getBookingQuerystringValue(
      schedulingSubmissionEvent.configuration.emailElementId,
      formSubmissionResult,
    ),
  }
  console.log('Attempting to generate scheduling configuration', url, body)

  await postRequest(url, body)
}

async function generateSchedulingConfiguration({
  formSubmissionResult,
  schedulingSubmissionEvent,
  schedulingUrlConfiguration: { schedulingCancelUrl, schedulingRescheduleUrl },
}: {
  formSubmissionResult: FormSubmissionResult
  schedulingSubmissionEvent: SubmissionEventTypes.FormSchedulingEvent
  schedulingUrlConfiguration: SchedulingUrlConfiguration
}): Promise<void> {
  try {
    await startNylasBooking({
      formSubmissionResult,
      schedulingSubmissionEvent,
      schedulingCancelUrl,
      schedulingRescheduleUrl,
    })
    return
  } catch (error) {
    console.warn(
      'Error occurred while attempting to generate configuration for scheduling submission event',
      error,
    )
    Sentry.captureException(error)
    if (error instanceof OneBlinkAppsError) {
      throw error
    }
    if (error instanceof HTTPError) {
      switch (error.status) {
        case 401: {
          throw new OneBlinkAppsError(
            'You cannot make bookings until you have logged in. Please login and try again.',
            {
              originalError: error,
              httpStatusCode: error.status,
              requiresLogin: true,
            },
          )
        }
        case 403: {
          throw new OneBlinkAppsError(
            'You do not have access to make bookings. Please contact your administrator to gain the correct level of access.',
            {
              originalError: error,
              httpStatusCode: error.status,
              requiresAccessRequest: true,
            },
          )
        }
        case 400:
        case 404: {
          throw new OneBlinkAppsError(
            'We could not find the configuration required to make a booking. Please contact your administrator to verify your configuration.',
            {
              originalError: error,
              httpStatusCode: error.status,
            },
          )
        }
      }
    }
    throw new OneBlinkAppsError(
      'An unknown error has occurred. Please contact support if the problem persists.',
      {
        originalError: error instanceof Error ? error : undefined,
      },
    )
  }
}

/**
 * Create a Nylas Session
 *
 * #### Example
 *
 * ```js
 * const { sessionId, configurationId, bookingRef, name, email } =
 *   await schedulingService.createNylasExistingBookingSession(
 *     '89c6e98e-f56f-45fc-84fe-c4fc62331d34',
 *   )
 * // use sessionId and configurationId/bookingRef to create or modify nylas bookings
 * ```
 *
 * @param submissionId
 * @param abortSignal
 * @returns
 */
async function createNylasExistingBookingSession(
  submissionId: string,
  abortSignal: AbortSignal,
): Promise<{
  /** The identifier to allow the user to make a booking */
  sessionId: string
  /** The identifier for the configuration the user will make a booking with */
  configurationId: string
  /** The name of the current user to prefill into the booking form */
  name: string | undefined
  /** The email address of the current user to prefill into the booking form */
  email: string | undefined
  /** The unique reference for an existing booking to reschedule or cancel */
  bookingRef: string | undefined
}> {
  const url = `${tenants.current.apiOrigin}/scheduling/nylas/authorise-booking`
  try {
    return await postRequest(url, { submissionId }, abortSignal)
  } catch (e) {
    console.warn('Error occurred while attempting to create a nylas session', e)
    Sentry.captureException(e)
    if (e instanceof OneBlinkAppsError) {
      throw e
    }

    const error = e as HTTPError
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot start a session until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You may not create or modify a calendar booking for a form you did not submit',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          },
        )
      }
      case 400:
        throw new OneBlinkAppsError(error.message, {
          title: 'Invalid Request',
          originalError: error,
          httpStatusCode: error.status,
        })
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find a booking to create a session',
          {
            title: 'Invalid Request',
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            title: 'Unknown Erorr',
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

export { generateSchedulingConfiguration, createNylasExistingBookingSession }
