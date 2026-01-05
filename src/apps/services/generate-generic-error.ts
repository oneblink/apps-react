import { isOffline } from '../offline-service'
import { HTTPError } from './fetch'
import OneBlinkAppsError from '../services/errors/oneBlinkAppsError'
import Sentry from '../Sentry'

const generateGenericError = (err: unknown, abortSignal?: AbortSignal) => {
  if (!abortSignal?.aborted) {
    Sentry.captureException(err)
  }
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
    case 400: {
      return new OneBlinkAppsError(error.message, {
        title: 'Invalid',
        httpStatusCode: error.status,
      })
    }
    case 401: {
      return new OneBlinkAppsError('Please login and try again.', {
        originalError: error,
        requiresLogin: true,
        httpStatusCode: error.status,
      })
    }
    case 403: {
      return new OneBlinkAppsError(
        'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
        {
          originalError: error,
          requiresAccessRequest: true,
          httpStatusCode: error.status,
        },
      )
    }
    case 404: {
      return new OneBlinkAppsError(
        "Please contact your administrator to ensure this application's configuration has been completed successfully.",
        {
          originalError: error,
          title: 'Unknown Application',
          httpStatusCode: error.status,
        },
      )
    }
    default: {
      return new OneBlinkAppsError(
        'An unknown error has occurred. Please contact support if the problem persists.',
        {
          originalError: error,
          httpStatusCode: error.status,
        },
      )
    }
  }
}

export default generateGenericError
