import { OneBlinkStorageError } from '@oneblink/storage'
import Sentry from '../../Sentry'
import { isOffline } from '../../offline-service'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import generateOneBlinkDownloader from '../generateOneBlinkDownloader'

export async function downloadPreFillFormData<
  T extends Record<string, unknown>,
>(
  formId: number,
  preFillFormDataId: string,
  abortSignal?: AbortSignal,
): Promise<T> {
  try {
    console.log('Attempting to download pre fill form data:', {
      formId,
      preFillFormDataId,
    })
    const oneblinkDownloader = generateOneBlinkDownloader()
    const data = await oneblinkDownloader.downloadPrefillData<T>({
      preFillFormDataId,
      formId,
      abortSignal,
    })
    if (!data) {
      throw new OneBlinkAppsError(
        "Data has been removed based on your administrator's prefill data retention policy.",
        {
          title: 'Prefill Data Unavailable',
        },
      )
    }
    return data
  } catch (error) {
    console.error('Error retrieving pre-fill data', error)

    if (error instanceof OneBlinkAppsError) {
      throw error
    }

    Sentry.captureException(error)

    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline and do not have a local copy of this app available, please connect to the internet and try again',
        {
          originalError: error instanceof Error ? error : undefined,
          isOffline: true,
        },
      )
    }

    if (error instanceof OneBlinkStorageError) {
      switch (error.httpStatusCode) {
        case 401: {
          throw new OneBlinkAppsError(
            'The application you are attempting to view requires authentication. Please login and try again.',
            {
              originalError: error,
              requiresLogin: true,
              httpStatusCode: error.httpStatusCode,
            },
          )
        }
        case 403: {
          throw new OneBlinkAppsError(
            'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
            {
              originalError: error,
              requiresAccessRequest: true,
              httpStatusCode: error.httpStatusCode,
            },
          )
        }
        case 400:
        case 404: {
          throw new OneBlinkAppsError(error.message, {
            title: 'Invalid Request',
            httpStatusCode: error.httpStatusCode,
          })
        }
      }
    }

    throw new OneBlinkAppsError(
      'An unknown error has occurred. Please contact support if the problem persists.',
      {
        originalError: error instanceof Error ? error : undefined,
        httpStatusCode:
          error instanceof OneBlinkStorageError
            ? error.httpStatusCode
            : undefined,
      },
    )
  }
}
