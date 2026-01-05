import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import {
  createNotificationsSubscription,
  deleteNotificationsSubscription,
} from './services/api/notifications'
import { isOffline } from './offline-service'
import tenants from './tenants'
import Sentry from './Sentry'
import { FormsAppsTypes } from '@oneblink/types'
import { getRequest, HTTPError, putRequest } from './services/fetch'

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    // eslint-disable-next-line no-useless-escape
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

let applicationServerKey: null | Uint8Array = null
let _isInitialised = false
let _swRegistration: null | ServiceWorkerRegistration = null

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (_isInitialised) {
    return _swRegistration
  }

  applicationServerKey = urlB64ToUint8Array(tenants.current.vapidPublicKey)

  if ('serviceWorker' in navigator && navigator.serviceWorker) {
    try {
      _swRegistration = await navigator.serviceWorker.ready
      console.log('Service Worker is registered', _swRegistration)
    } catch (error) {
      Sentry.captureException(error)
      console.error('Notifications Service init error', error)
    }
  }

  _isInitialised = true
  return _swRegistration
}

/**
 * Check if the user is currently subscribed to notifications
 *
 * #### Example
 *
 * ```js
 * const isSubscribed = await notificationService.isSubscribed()
 * // Allow user to subscribe or unsubscribe
 * ```
 *
 * @returns
 */
async function isSubscribed(): Promise<boolean> {
  const swRegistration = await getServiceWorkerRegistration()
  if (!swRegistration) {
    return false
  }

  const subscription = await swRegistration.pushManager.getSubscription()
  return !!subscription
}

/**
 * Subscribe the current user to notifications
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const isSubscribed = await notificationService.subscribe(formsAppId)
 * // isSubscribed will be false if user denied permission to push notifications
 * ```
 *
 * @param formsAppId
 * @returns
 */
async function subscribe(formsAppId: number): Promise<boolean> {
  if (isOffline()) {
    throw new OneBlinkAppsError(
      'You are currently offline, please connect to the internet and try again.',
      {
        isOffline: true,
      },
    )
  }

  const swRegistration = await getServiceWorkerRegistration()
  if (!swRegistration) {
    return false
  }

  if (
    !('Notification' in window) ||
    !swRegistration.pushManager ||
    !swRegistration.pushManager.subscribe
  ) {
    throw new OneBlinkAppsError(
      'Sorry, push notifications are not support for your device.',
      {
        title: 'Unsupported Device',
      },
    )
  }

  try {
    const key = applicationServerKey
    if (!key) {
      throw new Error(
        'Notifications have not been configured for your application.',
      )
    }

    const permission = await Notification.requestPermission()
    // If the user accepts, create subscription
    if (permission !== 'granted') {
      throw new OneBlinkAppsError(
        'It looks like you may have denied this app permission to send you push notifications. Please grant this app the notifications permission and try again.',
        {
          title: 'Permission Required',
        },
      )
    }

    console.log('User has granted notifications permission')

    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    })
    console.log('Subscribed to Service Worker Push:', subscription)
    try {
      await createNotificationsSubscription(formsAppId, subscription)
    } catch (error) {
      await subscription.unsubscribe()
      throw error
    }
    console.log('Successfully subscribed to push notifications')
    return true
  } catch (error) {
    console.warn('Failed to subscribe the user:', error)

    if (Notification.permission === 'denied') {
      console.warn('Permission for notifications was denied')
      throw new OneBlinkAppsError(
        'It looks like you may have denied this app permission to send you push notifications. Please grant this app the notifications permission and try again.',
        {
          title: 'Permission Required',
          originalError: error as Error,
        },
      )
    }

    if (error instanceof OneBlinkAppsError) {
      throw error
    }

    Sentry.captureException(error)

    throw new OneBlinkAppsError(
      'We were unable to subscribe you to push notifications, please try again and contact support if the problem persists.',
      {
        title: 'Permission Required',
        originalError: error as Error,
      },
    )
  }
}

/**
 * Subscribe the current user to notifications
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * await notificationService.unsubscribe(formsAppId)
 * // isSubscribed will be false if user denied permission to push notifications
 * ```
 *
 * @param formsAppId
 * @returns
 */
async function unsubscribe(formsAppId: number): Promise<void> {
  if (isOffline()) {
    throw new OneBlinkAppsError(
      'You are currently offline, please connect to the internet and try again.',
      {
        isOffline: true,
      },
    )
  }

  const swRegistration = await getServiceWorkerRegistration()
  if (!swRegistration) {
    return
  }

  console.log('Checking for subscription to unsubscribe')
  try {
    const subscription = await swRegistration.pushManager.getSubscription()
    if (!subscription) {
      console.log('No subscription')
      return
    }

    await subscription.unsubscribe()
    console.log(
      'Unsubscribed from Service Worker Push subscription',
      subscription,
    )

    await deleteNotificationsSubscription(formsAppId, subscription).catch(
      (error) => {
        Sentry.captureException(error)
        // Ignore this error as the server should remove
        // this subscription the next time it tries to use it.
        console.warn('Could not delete subscription on server', error)
      },
    )
  } catch (error) {
    Sentry.captureException(error)
    console.warn('Failed to unsubscribe the user:', error)
    throw new OneBlinkAppsError(
      'We were unable to unsubscribe you from push notifications, please try again and contact support if the problem persists.',
      {
        originalError: error as Error,
      },
    )
  }
}

/**
 * Get the current users email subscriptions for a single forms app.
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const emailSubscriptions =
 *   await approvalsService.getEmailSubscriptions(formsAppId)
 * ```
 *
 * @param formsAppId
 * @param abortSignal
 * @returns
 */
export async function getEmailSubscriptions(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<FormsAppsTypes.FormsAppUserSubscription['emailSubscriptions']> {
  try {
    const { emailSubscriptions } =
      await getRequest<FormsAppsTypes.FormsAppUserSubscription>(
        `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/my-preferences`,
        abortSignal,
      )
    return emailSubscriptions
  } catch (err) {
    console.error('Error retrieving preferences for current user', err)
    Sentry.captureException(err)

    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot access your email subscriptions without first logging in. Please login and try again.',
          {
            originalError: error,
            requiresLogin: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(error.message, {
          title: 'Invalid Request',
          httpStatusCode: error.status,
        })
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

/**
 * Update the current users email subscriptions for a single forms app.
 *
 * #### Example
 *
 * ```js
 * const emailSubscriptions = {
 *   newApproval: true,
 *   clarificationReceived: true,
 * }
 * const savedFormsAppUserSubscription =
 *   await approvalsService.updateFormsAppUserSubscription(
 *     emailSubscriptions,
 *   )
 * ```
 *
 * @param formsAppId
 * @param emailSubscriptions
 * @param abortSignal
 * @returns
 */
export async function updateEmailSubscriptions(
  formsAppId: number,
  emailSubscriptions: FormsAppsTypes.FormsAppUserSubscription['emailSubscriptions'],
  abortSignal?: AbortSignal,
): Promise<void> {
  try {
    await putRequest<FormsAppsTypes.FormsAppUserSubscription>(
      `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/my-preferences`,
      { emailSubscriptions },
      abortSignal,
    )
  } catch (err) {
    console.error('Error retrieving preferences for current user', err)
    Sentry.captureException(err)

    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot update your email subscriptions without first logging in. Please login and try again.',
          {
            originalError: error,
            requiresLogin: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(error.message, {
          title: 'Invalid Request',
          httpStatusCode: error.status,
        })
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

export { isSubscribed, subscribe, unsubscribe }
