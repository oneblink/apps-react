declare global {
  interface Window {
    cordova: unknown
  }
}

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
