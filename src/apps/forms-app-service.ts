import { FormsAppsTypes, EnvironmentTypes } from '@oneblink/types'
import tenants from './tenants'
import { HTTPError, getRequest } from './services/fetch'
import { isOffline } from './offline-service'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import Sentry from './Sentry'

export type FormsAppConfigurationResponse =
  FormsAppsTypes.FormsAppConfiguration<EnvironmentTypes.FormsAppEnvironmentStyles>

/**
 * Get configuration for a OneBlink Forms App.
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const formsApp =
 *   await formsAppService.getFormsAppConfiguration(formAppId)
 * ```
 *
 * @param formsAppId
 * @param abortSignal
 * @returns
 */
export async function getFormsAppConfiguration(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<FormsAppConfigurationResponse> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/hostname-configuration`

  try {
    return await getRequest<FormsAppConfigurationResponse>(url, abortSignal)
  } catch (err) {
    Sentry.captureException(err)

    const error = err as HTTPError

    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline and do not have a local copy of this app available, please connect to the internet and try again',
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
          'We could not find the forms app you are looking for. Please contact support if the problem persists.',
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
