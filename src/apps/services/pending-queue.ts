import OneBlinkAppsError from './errors/oneBlinkAppsError'
import utilsService from './utils'
import Sentry from '../Sentry'
import {
  FormSubmission,
  PendingFormSubmission,
  ProgressListener,
  ProgressListenerEvent,
} from '../types/submissions'
import { getPrefillKey } from '../services/job-prefill'

function errorHandler(error: Error): Error {
  Sentry.captureException(error)
  console.error('Local Forage Error', error)
  if (/The serialized value is too large/.test(error.message)) {
    return new OneBlinkAppsError(
      'It seems you have run out of space. To free up space, please connect to the internet to process pending submissions.',
      {
        originalError: error,
      },
    )
  }

  return error
}

const PENDING_QUEUE_SUBMISSIONS_KEY = 'submissions'

export type PendingQueueAction =
  | 'SUBMIT_STARTED'
  | 'SUBMIT_FAILED'
  | 'SUBMIT_SUCCEEDED'
  | 'ADDITION'
  | 'DELETION'
  | 'EDIT_STARTED'
  | 'EDIT_CANCELLED'
export type PendingQueueListener = (
  results: PendingFormSubmission[],
  action: PendingQueueAction,
) => unknown
const pendingQueueListeners: Array<PendingQueueListener> = []

/**
 * Register a listener function that will be passed an array of
 * PendingFormSubmissions when the pending queue is modified.
 *
 * ### Example
 *
 * ```js
 * const listener = async (pendingSubmissions) => {
 *   // use pending submissions here...
 * }
 * const deregister =
 *   await submissionService.registerPendingQueueListener(listener)
 *
 * // When no longer needed, remember to deregister the listener
 * deregister()
 * ```
 *
 * @param listener
 * @returns
 */
export function registerPendingQueueListener(
  listener: PendingQueueListener,
): () => void {
  pendingQueueListeners.push(listener)

  return () => {
    const index = pendingQueueListeners.indexOf(listener)
    if (index !== -1) {
      pendingQueueListeners.splice(index, 1)
    }
  }
}

function executePendingQueueListeners(
  newSubmissions: PendingFormSubmission[],
  action: PendingQueueAction,
) {
  console.log(
    'Pending Queue submissions have been updated',
    action,
    newSubmissions,
  )
  for (const pendingQueueListener of pendingQueueListeners) {
    pendingQueueListener(newSubmissions, action)
  }
}

export async function addFormSubmissionToPendingQueue(
  formSubmission: FormSubmission,
) {
  const pendingTimestamp = new Date().toISOString()
  try {
    const submissions: PendingFormSubmission[] =
      await getPendingQueueSubmissions()
    submissions.push({
      ...formSubmission,
      pendingTimestamp,
    } as PendingFormSubmission)
    await utilsService.localForage.setItem(
      PENDING_QUEUE_SUBMISSIONS_KEY,
      submissions,
    )
    executePendingQueueListeners(submissions, 'ADDITION')
  } catch (error) {
    Sentry.captureException(error)
    throw error instanceof Error ? errorHandler(error) : error
  }
}

export async function updatePendingQueueSubmission(
  pendingTimestamp: string,
  newSubmission: PendingFormSubmission,
  action:
    | 'SUBMIT_FAILED'
    | 'SUBMIT_STARTED'
    | 'EDIT_STARTED'
    | 'EDIT_CANCELLED',
  skipSentry?: boolean,
) {
  try {
    const submissions = await getPendingQueueSubmissions()
    const newSubmissions = submissions.map((submission) => {
      if (submission.pendingTimestamp === pendingTimestamp) {
        return { ...newSubmission }
      }
      return submission
    })
    await utilsService.localForage.setItem(
      PENDING_QUEUE_SUBMISSIONS_KEY,
      newSubmissions,
    )
    executePendingQueueListeners(newSubmissions, action)
  } catch (error) {
    if (!skipSentry) {
      Sentry.captureException(error)
    }

    throw error instanceof Error ? errorHandler(error) : error
  }
}

/**
 * Cancel editing a PendingFormSubmission based on the `pendingTimestamp`
 * property. The function marks the submission as ready for processing by the
 * pending queue
 *
 * ### Example
 *
 * ```js
 * const pendingTimestamp = '2020-07-29T01:03:26.573Z'
 *
 * await submissionService.cancelEditingPendingQueueSubmission(
 *   pendingTimestamp,
 * )
 * ```
 *
 * @param pendingTimestamp
 */
export async function cancelEditingPendingQueueSubmission(
  pendingTimestamp: string,
) {
  try {
    const submissions = await getPendingQueueSubmissions()
    const targetSubmission = submissions.find((submission) => {
      return submission.pendingTimestamp === pendingTimestamp
    })
    if (targetSubmission) {
      await updatePendingQueueSubmission(
        pendingTimestamp,
        { ...targetSubmission, isEditing: false },
        'EDIT_CANCELLED',
        //this is to avoid logging to sentry twice
        true,
      )
    }
  } catch (error) {
    Sentry.captureException(error)
    throw error instanceof Error ? errorHandler(error) : error
  }
}

/**
 * Get an array of PendingFormSubmission
 *
 * ### Example
 *
 * ```js
 * const pendingSubmission =
 *   await submissionService.getPendingQueueSubmissions()
 * // Display pending submissions to user...
 * ```
 *
 * @returns
 */
export async function getPendingQueueSubmissions(): Promise<
  PendingFormSubmission[]
> {
  const pendingQueueSubmissionsInStorage =
    await utilsService.localForage.getItem<PendingFormSubmission[]>(
      PENDING_QUEUE_SUBMISSIONS_KEY,
    )

  if (!pendingQueueSubmissionsInStorage) {
    return []
  }

  // Form submission data use to be stored separate to the array of pending records
  // so to ensure all pending records have submission data we will pull it from
  // where it use to be stored if there is isn't any form submission data.
  // This is could only happen if a user had the latest code (I.e. they are online)
  // and they have a submission in the pending queue that cannot be submitted
  // (E.g. they need to login or one of the attachments could not be uploaded).
  const pendingQueueSubmissions: PendingFormSubmission[] = []
  for (const pendingQueueSubmission of pendingQueueSubmissionsInStorage) {
    if (pendingQueueSubmission.submission) {
      pendingQueueSubmissions.push(pendingQueueSubmission)
    } else {
      const formSubmission =
        await utilsService.getLocalForageItem<FormSubmission>(
          `SUBMISSION_${pendingQueueSubmission.pendingTimestamp}`,
        )
      if (formSubmission) {
        pendingQueueSubmission.submission = formSubmission.submission
        pendingQueueSubmissions.push(pendingQueueSubmission)
      }
    }
  }
  return pendingQueueSubmissions
}

/**
 * Delete a PendingFormSubmission before it is processed based on the
 * `pendingTimestamp` property.
 *
 * ### Example
 *
 * ```js
 * const pendingTimestamp = '2020-07-29T01:03:26.573Z'
 * await submissionService.deletePendingQueueSubmission(pendingTimestamp)
 * ```
 *
 * @param pendingTimestamp
 */
export async function deletePendingQueueSubmission(pendingTimestamp: string) {
  await removePendingQueueSubmission(pendingTimestamp, 'DELETION')
}

/**
 * Edit a PendingFormSubmission before it is processed based on the
 * `pendingTimestamp` property. The function places the submission in an editing
 * state preventing it from being processed by the pending queue and returns a
 * prefill id and form id
 *
 * ### Example
 *
 * ```js
 * const pendingTimestamp = '2020-07-29T01:03:26.573Z'
 * const { preFillFormDataId, formId } =
 *   await submissionService.editPendingQueueSubmission(pendingTimestamp)
 * window.location.href = `https://mycoolforms.apps.oneblink.io/forms/${formId}?preFillFormDataId=${preFillFormDataId}`
 * ```
 *
 * @param pendingTimestamp
 */
export async function editPendingQueueSubmission(
  pendingTimestamp: string,
): Promise<{ preFillFormDataId: string; formId: number }> {
  try {
    const pendingQueueSubmissions = await getPendingQueueSubmissions()
    const formSubmission = pendingQueueSubmissions.find(
      (pendingQueueSubmission) =>
        pendingQueueSubmission.pendingTimestamp === pendingTimestamp,
    )
    if (!formSubmission) {
      throw new Error('Could not find form submission to edit')
    }
    const preFillFormDataId = `PENDING_SUBMISSION_${pendingTimestamp}`
    const key = getPrefillKey(preFillFormDataId)
    await utilsService.setLocalForageItem(key, formSubmission.submission)
    await updatePendingQueueSubmission(
      pendingTimestamp,
      {
        ...formSubmission,
        pendingTimestamp,
        isEditing: true,
        isSubmitting: false,
        error: undefined,
      },
      'EDIT_STARTED',
      //this is to avoid logging to sentry twice
      true,
    )
    return { preFillFormDataId, formId: formSubmission.definition.id }
  } catch (error) {
    Sentry.captureException(error)
    throw error instanceof Error ? errorHandler(error) : error
  }
}

export async function removePendingQueueSubmission(
  pendingTimestamp: string,
  action: 'SUBMIT_SUCCEEDED' | 'DELETION',
) {
  try {
    await utilsService.removeLocalForageItem(`SUBMISSION_${pendingTimestamp}`)
    const submissions = await getPendingQueueSubmissions()
    const newSubmissions = submissions.filter(
      (submission) => submission.pendingTimestamp !== pendingTimestamp,
    )
    await utilsService.localForage.setItem(
      PENDING_QUEUE_SUBMISSIONS_KEY,
      newSubmissions,
    )
    executePendingQueueListeners(newSubmissions, action)
  } catch (error) {
    Sentry.captureException(error)
    throw error instanceof Error ? errorHandler(error) : error
  }
}

const pendingQueueAttachmentProgressListeners: Array<{
  attachmentId: string
  listener: ProgressListener
}> = []

/**
 * Register a listener function that will be passed a progress event when an
 * attachment for an item in the pending queue is being processed.
 *
 * ### Example
 *
 * ```js
 * const listener = async ({ progress }) => {
 *   // update the UI to reflect the progress here...
 * }
 * const deregister =
 *   await submissionService.registerPendingQueueAttachmentProgressListener(
 *     attachment.id,
 *     listener,
 *   )
 *
 * // When no longer needed, remember to deregister the listener
 * deregister()
 * ```
 *
 * @param attachmentId
 * @param listener
 * @returns
 */
export function registerPendingQueueAttachmentProgressListener(
  attachmentId: string,
  listener: ProgressListener,
): () => void {
  const item = { attachmentId, listener }
  pendingQueueAttachmentProgressListeners.push(item)

  return () => {
    const index = pendingQueueAttachmentProgressListeners.indexOf(item)
    if (index !== -1) {
      pendingQueueAttachmentProgressListeners.splice(index, 1)
    }
  }
}

export function executePendingQueueAttachmentProgressListeners(
  event: ProgressListenerEvent & {
    attachmentId: string
  },
) {
  for (const pendingQueueAttachmentProgressListener of pendingQueueAttachmentProgressListeners) {
    if (
      event.attachmentId === pendingQueueAttachmentProgressListener.attachmentId
    ) {
      pendingQueueAttachmentProgressListener.listener(event)
    }
  }
}

const pendingQueueProgressListeners: Array<{
  pendingTimestamp: string
  listener: ProgressListener
}> = []

/**
 * Register a listener function that will be passed a progress event when an
 * item in the pending queue is being processed.
 *
 * ### Example
 *
 * ```js
 * const listener = async ({ progress }) => {
 *   // update the UI to reflect the progress here...
 * }
 * const deregister =
 *   await submissionService.registerPendingQueueProgressListener(
 *     pendingQueueItem.pendingTimestamp,
 *     listener,
 *   )
 *
 * // When no longer needed, remember to deregister the listener
 * deregister()
 * ```
 *
 * @param pendingTimestamp
 * @param listener
 * @returns
 */
export function registerPendingQueueProgressListener(
  pendingTimestamp: string,
  listener: ProgressListener,
): () => void {
  const item = { pendingTimestamp, listener }
  pendingQueueProgressListeners.push(item)

  return () => {
    const index = pendingQueueProgressListeners.indexOf(item)
    if (index !== -1) {
      pendingQueueProgressListeners.splice(index, 1)
    }
  }
}

export function executePendingQueueProgressListeners(
  event: ProgressListenerEvent & {
    pendingTimestamp: string
  },
) {
  for (const pendingQueueProgressListener of pendingQueueProgressListeners) {
    if (
      event.pendingTimestamp === pendingQueueProgressListener.pendingTimestamp
    ) {
      pendingQueueProgressListener.listener(event)
    }
  }
}
