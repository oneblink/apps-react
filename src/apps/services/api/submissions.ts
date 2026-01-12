import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import Sentry from '../../Sentry'
import { isOffline } from '../../offline-service'
import { getDeviceInformation } from '../getDeviceInformation'
import { FormSubmission, ProgressListener } from '../../types/submissions'
import { getUserToken } from '../user-token'
import generateOneBlinkUploader from '../generateOneBlinkUploader'
import { OneBlinkStorageError } from '@oneblink/storage'
import generateOneBlinkDownloader from '../generateOneBlinkDownloader'

const getBadRequestError = (error: OneBlinkStorageError) => {
  return new OneBlinkAppsError(error.message, {
    title: 'Invalid Submission',
    httpStatusCode: error.httpStatusCode,
  })
}
const getUnauthenticatedError = (error: OneBlinkStorageError) => {
  return new OneBlinkAppsError(
    'The form you are attempting to complete requires authentication. Please login and try again.',
    {
      requiresLogin: true,
      originalError: error,
      httpStatusCode: error.httpStatusCode,
    },
  )
}
const getUnauthorisedError = (error: OneBlinkStorageError) => {
  return new OneBlinkAppsError(
    'You do not have access to complete this form. Please contact your administrator to gain the correct level of access.',
    {
      requiresAccessRequest: true,
      originalError: error,
      httpStatusCode: error.httpStatusCode,
    },
  )
}
const getNotFoundError = (error: OneBlinkStorageError) => {
  return new OneBlinkAppsError(
    'We could not find the form you are looking for. Please contact your administrator to ensure your form configuration has been completed successfully.',
    {
      title: 'Unknown Form',
      originalError: error,
      httpStatusCode: error.httpStatusCode,
    },
  )
}
const getDefaultError = (error: OneBlinkStorageError) => {
  return new OneBlinkAppsError(
    'An unknown error has occurred. Please contact support if the problem persists.',
    {
      originalError: error,
      httpStatusCode: error.httpStatusCode,
    },
  )
}

const handleError = (error: OneBlinkStorageError) => {
  if (/Failed to fetch/.test((error as Error).message)) {
    throw new OneBlinkAppsError(
      'We encountered a network related issue. Please ensure you are connected to the internet before trying again. If the problem persists, contact your administrator.',
      {
        title: 'Connectivity Issues',
        originalError: error as Error,
        isOffline: true,
      },
    )
  }
  switch (error.httpStatusCode) {
    case 400: {
      return getBadRequestError(error)
    }
    case 401: {
      return getUnauthenticatedError(error)
    }
    case 403: {
      return getUnauthorisedError(error)
    }
    case 404: {
      return getNotFoundError(error)
    }
    default: {
      return getDefaultError(error)
    }
  }
}

export async function uploadFormSubmission(
  formSubmission: FormSubmission,
  /**
   * The date and time (in ISO format) the form was completed I.e. when the user
   * clicked the submit button
   */
  completionTimestamp: string,
  onProgress?: ProgressListener,
  abortSignal?: AbortSignal,
) {
  try {
    const oneblinkUploader = generateOneBlinkUploader()

    const userToken = getUserToken()

    console.log('Uploading submission')
    return await oneblinkUploader.uploadSubmission({
      completionTimestamp,
      submission: formSubmission.submission,
      definition: formSubmission.definition,
      device: getDeviceInformation(),
      userToken: userToken || undefined,
      previousFormSubmissionApprovalId:
        formSubmission.previousFormSubmissionApprovalId,
      jobId: formSubmission.jobId || undefined,
      formsAppId: formSubmission.formsAppId,
      externalId: formSubmission.externalId || undefined,
      taskId: formSubmission.taskCompletion?.task.taskId || undefined,
      taskActionId: formSubmission.taskCompletion?.taskAction.taskActionId,
      taskGroupInstanceId:
        formSubmission.taskCompletion?.taskGroupInstance?.taskGroupInstanceId,
      recaptchas: formSubmission.recaptchas,
      onProgress,
      abortSignal,
      formSubmissionDraftId: formSubmission.formSubmissionDraftId,
    })
  } catch (error) {
    throw handleError(error as OneBlinkStorageError)
  }
}

export async function downloadFormSubmission({
  formId,
  submissionId,
  abortSignal,
}: {
  formId: number
  submissionId: string
  abortSignal?: AbortSignal
}) {
  try {
    console.log('Attempting to download form submission data:', {
      formId,
      submissionId,
    })
    const oneblinkDownloader = generateOneBlinkDownloader()
    const submissionData = await oneblinkDownloader.downloadSubmission({
      formId,
      submissionId,
      abortSignal,
    })
    if (!submissionData) {
      throw new OneBlinkAppsError(
        "This submission has been removed based on your administrator's retention policy.",
        {
          title: 'Submission Data Unavailable',
        },
      )
    }
    return submissionData
  } catch (error) {
    console.error('Error retrieving form submission data', error)

    if (error instanceof OneBlinkAppsError) {
      throw error
    }

    Sentry.captureException(error)

    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
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
            'The submission you are attempting to view requires authentication. Please login and try again.',
            {
              originalError: error,
              requiresLogin: true,
              httpStatusCode: error.httpStatusCode,
            },
          )
        }
        case 403: {
          throw new OneBlinkAppsError(
            'You do not have access to submission data. Please contact your administrator to gain the correct level of access.',
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
