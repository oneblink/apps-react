import { HTTPError, postRequest } from '../fetch'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import tenants from '../../tenants'
import { isOffline } from '../../offline-service'
import Sentry from '../../Sentry'

const subscriptionErrorHandler = (error: HTTPError) => {
  Sentry.captureException(error)
  console.warn('Error POSTing notifications subscription', error)
  if (isOffline()) {
    throw new OneBlinkAppsError(
      'You are currently offline, please connect to the internet and try again.',
      {
        originalError: error,
        isOffline: true,
      },
    )
  }
  switch (error.status) {
    case 401: {
      throw new OneBlinkAppsError(
        'You cannot subscribe to notifications until you logged in. Please login and try again.',
        {
          originalError: error,
          httpStatusCode: error.status,
          requiresLogin: true,
        },
      )
    }
    case 403: {
      throw new OneBlinkAppsError(
        'You do not have access to subscribe to notifications in the app. Please contact your administrator to gain the correct level of access.',
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
        'We could not find your account. Please contact your administrator to ensure your account has been completed successfully.',
        {
          originalError: error,
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

async function createNotificationsSubscription(
  formsAppId: number,
  subscription: PushSubscription,
): Promise<void> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/notifications/subscribe`
  console.log('Attempting to create notifications subscription', url)
  await postRequest(url, {
    subscription,
  }).catch(subscriptionErrorHandler)
}

async function deleteNotificationsSubscription(
  formsAppId: number,
  subscription: PushSubscription,
): Promise<void> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/notifications/unsubscribe`
  console.log('Attempting to delete notifications subscription', url)
  await postRequest(url, {
    subscription,
  }).catch(subscriptionErrorHandler)
}

export { createNotificationsSubscription, deleteNotificationsSubscription }
