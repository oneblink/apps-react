import { SubmissionTypes } from '@oneblink/types'
import { getRequest, HTTPError, deleteRequest } from '../fetch'
import { isLoggedIn } from '../../auth-service'
import { getDeviceInformation } from '../getDeviceInformation'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import tenants from '../../tenants'
import { getUserToken } from '../user-token'
import Sentry from '../../Sentry'
import prepareSubmissionData from '../prepareSubmissionData'
import { DraftSubmission, ProgressListener } from '../../types/submissions'
import generateOneBlinkUploader from '../generateOneBlinkUploader'
import { OneBlinkStorageError } from '@oneblink/storage'
import generateOneBlinkDownloader from '../generateOneBlinkDownloader'

async function uploadDraftData(
  draftSubmission: DraftSubmission,
  onProgress?: ProgressListener,
  abortSignal?: AbortSignal,
) {
  try {
    const submission = await prepareSubmissionData(draftSubmission)
    const oneblinkUploader = generateOneBlinkUploader()
    const userToken = getUserToken()
    console.log('Attempting to upload draft data')
    return await oneblinkUploader.uploadFormSubmissionDraft({
      submission,
      definition: draftSubmission.definition,
      device: getDeviceInformation(),
      userToken: userToken || undefined,
      previousFormSubmissionApprovalId:
        draftSubmission.previousFormSubmissionApprovalId,
      jobId: draftSubmission.jobId,
      formsAppId: draftSubmission.formsAppId,
      externalId: draftSubmission.externalId,
      taskId: draftSubmission.taskCompletion?.task.taskId,
      taskActionId: draftSubmission.taskCompletion?.taskAction.taskActionId,
      taskGroupInstanceId:
        draftSubmission.taskCompletion?.taskGroupInstance?.taskGroupInstanceId,
      formSubmissionDraftId: draftSubmission.formSubmissionDraftId,
      createdAt: draftSubmission.createdAt,
      title: draftSubmission.title,
      lastElementUpdated: draftSubmission.lastElementUpdated,
      sectionState: draftSubmission.sectionState,
      previousElapsedDurationSeconds:
        draftSubmission.previousElapsedDurationSeconds,
      onProgress,
      abortSignal,
    })
  } catch (error) {
    console.warn('Error occurred while attempting to upload draft data', error)
    Sentry.captureException(error)
    if (error instanceof OneBlinkStorageError) {
      switch (error.httpStatusCode) {
        case 401: {
          throw new OneBlinkAppsError(
            'You cannot save drafts until you have logged in. Please login and try again.',
            {
              originalError: error,
              requiresLogin: true,
              httpStatusCode: error.httpStatusCode,
            },
          )
        }
        case 403: {
          throw new OneBlinkAppsError(
            'You do not have access to drafts for this application. Please contact your administrator to gain the correct level of access.',
            {
              originalError: error,
              requiresAccessRequest: true,
              httpStatusCode: error.httpStatusCode,
            },
          )
        }
        case 400:
        case 404: {
          throw new OneBlinkAppsError(
            'We could not find the application your attempting upload a draft for. Please contact your administrator to ensure your application configuration has been completed successfully.',
            {
              originalError: error,
              title: 'Unknown Application',
              httpStatusCode: error.httpStatusCode,
            },
          )
        }
      }
    }

    throw new OneBlinkAppsError(
      'An unknown error has occurred. Please contact support if the problem persists.',
      {
        originalError: error instanceof Error ? error : undefined,
      },
    )
  }
}

async function getFormSubmissionDrafts(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<SubmissionTypes.FormSubmissionDraft[]> {
  if (!isLoggedIn()) {
    console.log(
      'Could not retrieve drafts from API as the current user is not logged in.',
    )
    return []
  }

  const url = new URL('/form-submission-drafts', tenants.current.apiOrigin)
  url.searchParams.append('formsAppId', formsAppId.toString())
  url.searchParams.append('isSubmitted', 'false')
  console.log('Attempting to retrieve drafts from API', url.href)

  try {
    const { formSubmissionDrafts } = await getRequest<{
      formSubmissionDrafts: SubmissionTypes.FormSubmissionDraft[]
    }>(url.href, abortSignal)
    return formSubmissionDrafts
  } catch (err) {
    console.warn(
      'Error occurred while attempting to retrieve drafts from API',
      err,
    )
    if (err instanceof OneBlinkAppsError) {
      throw err
    }

    const error = err as HTTPError
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot retrieve your drafts until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to drafts for this application. Please contact your administrator to gain the correct level of access.',
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
          'We could not find the application your attempting retrieve drafts for. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            title: 'Error Syncing Drafts',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
          },
        )
      }
    }
  }
}

async function downloadDraftData(
  formSubmissionDraftVersionId: string,
  abortSignal?: AbortSignal,
) {
  try {
    console.log('Attempting to download draft form data:', {
      formSubmissionDraftVersionId,
    })
    const oneblinkDownloader = generateOneBlinkDownloader()
    const data = await oneblinkDownloader.downloadDraftSubmission({
      formSubmissionDraftVersionId,
      abortSignal,
    })
    if (!data) {
      throw new OneBlinkAppsError(
        "Data has been removed based on your administrator's draft data retention policy.",
        {
          title: 'Draft Data Unavailable',
        },
      )
    }
    return data
  } catch (error) {
    console.error(
      'Error occurred while attempting to download draft data',
      error,
    )

    if (error instanceof OneBlinkAppsError) {
      throw error
    }

    Sentry.captureException(error)

    if (error instanceof OneBlinkStorageError) {
      switch (error.httpStatusCode) {
        case 400: {
          throw new OneBlinkAppsError(error.message, {
            originalError: error,
            title: 'Invalid Request',
            httpStatusCode: error.httpStatusCode,
          })
        }
        case 401: {
          throw new OneBlinkAppsError(
            'You cannot retrieve draft data until you have logged in. Please login and try again.',
            {
              originalError: error,
              httpStatusCode: error.httpStatusCode,
              requiresLogin: true,
            },
          )
        }
        case 403: {
          throw new OneBlinkAppsError(
            'You do not have access to drafts for this application. Please contact your administrator to gain the correct level of access.',
            {
              originalError: error,
              httpStatusCode: error.httpStatusCode,
              requiresAccessRequest: true,
            },
          )
        }
        case 404: {
          throw new OneBlinkAppsError(
            'We could not find the draft your attempting retrieve. Please contact your administrator to ensure your application configuration has been completed successfully.',
            {
              originalError: error,
              title: 'Unknown Draft',
              httpStatusCode: error.httpStatusCode,
            },
          )
        }
      }
    }

    throw new OneBlinkAppsError(
      'An unknown error has occurred. Please contact support if the problem persists.',
      {
        title: 'Unexpected Error',
        originalError: error instanceof Error ? error : undefined,
        httpStatusCode:
          error instanceof OneBlinkStorageError
            ? error.httpStatusCode
            : undefined,
      },
    )
  }
}

async function deleteFormSubmissionDraft(
  formSubmissionDraftId: string,
  abortSignal?: AbortSignal,
) {
  const url = `${tenants.current.apiOrigin}/form-submission-drafts/${formSubmissionDraftId}`
  console.log('Attempting to delete form submission draft remotely', url)
  try {
    await deleteRequest(url, abortSignal)
  } catch (error) {
    console.warn(
      'Error occurred while attempting to delete a draft from API',
      error,
    )
    if (error instanceof OneBlinkAppsError) {
      throw error
    }

    Sentry.captureException(error)

    if (error instanceof HTTPError) {
      switch (error.status) {
        case 401: {
          throw new OneBlinkAppsError(
            'You cannot delete drafts until you have logged in. Please login and try again.',
            {
              originalError: error,
              httpStatusCode: error.status,
              requiresLogin: true,
            },
          )
        }
        case 403: {
          throw new OneBlinkAppsError(
            'You do not have access to drafts for this application. Please contact your administrator to gain the correct level of access.',
            {
              originalError: error,
              httpStatusCode: error.status,
              requiresAccessRequest: true,
            },
          )
        }
        case 400: {
          throw new OneBlinkAppsError(error.message, {
            originalError: error,
            title: 'Invalid Request',
            httpStatusCode: error.status,
          })
        }
        case 404: {
          console.warn(
            'Remote draft does not exist, we will assume it has already been deleted.',
            formSubmissionDraftId,
            error,
          )
          return
        }
      }
    }

    throw new OneBlinkAppsError(
      'An unknown error has occurred. Please contact support if the problem persists.',
      {
        originalError: error as Error,
      },
    )
  }
}

export {
  uploadDraftData,
  getFormSubmissionDrafts,
  downloadDraftData,
  deleteFormSubmissionDraft,
}
