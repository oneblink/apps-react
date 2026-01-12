/** An error class that extends `Error` */
export default class OneBlinkAppsError extends Error {
  /** The title of the error */
  title?: string
  /** Whether the application state is offline */
  isOffline: boolean
  /** Whether the attempted action required access */
  requiresAccessRequest: boolean
  /** Whether the attempted action required login */
  requiresLogin: boolean
  /** The http status code associated with the error */
  httpStatusCode?: number
  /** The original error that was thrown */
  originalError?: Error

  /**
   * Used to create an instance of the `OneBlinkAppsError` class.
   *
   * @param message The message associated with the error
   * @param options The options associated with the error
   */
  constructor(
    message: string,
    options: {
      /** The title of the error */
      title?: string
      /** Whether the application state is offline */
      isOffline?: boolean
      /** Whether the attempted action required access */
      requiresAccessRequest?: boolean
      /** Whether the attempted action required login */
      requiresLogin?: boolean
      /** The http status code associated with the error */
      httpStatusCode?: number
      /** The original error that was thrown */
      originalError?: Error
    } = {},
  ) {
    super(message)
    this.name = 'OneBlinkAppsError'

    let title = options.title
    if (!title) {
      if (options.requiresAccessRequest) {
        title = 'Access Denied'
      } else if (options.requiresLogin) {
        title = 'Login Required'
      } else if (options.isOffline) {
        title = 'Offline'
      }
    }

    this.title = title
    this.isOffline = options.isOffline || false
    this.requiresAccessRequest = options.requiresAccessRequest || false
    this.requiresLogin = options.requiresLogin || false
    this.originalError = options.originalError
    this.httpStatusCode = options.httpStatusCode
  }
}
