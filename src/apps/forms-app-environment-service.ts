import { EnvironmentTypes } from '@oneblink/types'
import tenants from './tenants'
import { HTTPError, getRequest } from './services/fetch'
import { isOffline } from './offline-service'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import Sentry from './Sentry'

/**
 * Get configuration for a OneBlink Forms App Environment.
 *
 * #### Example
 *
 * ```js
 * const formsAppEnvironmentId = 1
 * const configuration =
 *   await formsAppEnvironmentService.getFormsAppEnvironmentConfiguration(
 *     formsAppEnvironmentId,
 *   )
 * ```
 *
 * @param formsAppEnvironmentId
 * @param abortSignal
 * @returns
 */
export async function getFormsAppEnvironmentConfiguration(
  formsAppEnvironmentId: number,
  abortSignal?: AbortSignal,
): Promise<EnvironmentTypes.FormsAppEnvironmentConfiguration> {
  const url = `${tenants.current.apiOrigin}/forms-app-environments/${formsAppEnvironmentId}/configuration`

  try {
    return await getRequest<EnvironmentTypes.FormsAppEnvironmentConfiguration>(
      url,
      abortSignal,
    )
  } catch (err) {
    Sentry.captureException(err)

    const error = err as HTTPError

    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline and do not have a local copy of this form available, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }

    switch (error.status) {
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the form you are looking for. Please contact support if the problem persists.',
          {
            originalError: error,
            title: 'Unknown Form',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}
