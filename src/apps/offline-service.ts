declare global {
  interface Window {
    cordova: unknown
  }
}

/**
 * The message presented to the user when an action cannot be completed because
 * the application is offline.
 */
export const OFFLINE_ERROR_MESSAGE =
  'You are currently offline, please connect to the internet and try again'

/**
 * Check if the user is currently offline
 *
 * #### Example
 *
 * ```js
 * const isOffline = offlineService.isOffline()
 * // handle user being offline
 * ```
 *
 * @returns
 */
export function isOffline(): boolean {
  if (!window.navigator) {
    return false
  }

  if (window.cordova) {
    // @ts-expect-error
    return window.navigator.connection.type === 'none'
  } else {
    return !window.navigator.onLine
  }
}
