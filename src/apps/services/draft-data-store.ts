import utilsService from './utils'

import {
  uploadDraftData,
  downloadDraftData,
  deleteFormSubmissionDraft,
} from './api/drafts'
import { SubmissionTypes } from '@oneblink/types'
import Sentry from '../Sentry'
import { DraftSubmission, ProgressListener } from '../types/submissions'
import { deleteAutoSaveData } from '../auto-save-service'

function getLocalDraftSubmissionKey(formSubmissionDraftId: string) {
  return `DRAFT_SUBMISSION_${formSubmissionDraftId}`
}

export async function getLocalDraftSubmission(
  formSubmissionDraftId: string | undefined,
): Promise<DraftSubmission | null> {
  if (!formSubmissionDraftId) {
    return null
  }
  const key = getLocalDraftSubmissionKey(formSubmissionDraftId)
  return utilsService.getLocalForageItem(key)
}

async function setLocalDraftSubmission(
  draftSubmission: DraftSubmission,
): Promise<DraftSubmission> {
  const key = getLocalDraftSubmissionKey(draftSubmission.formSubmissionDraftId)
  return utilsService.setLocalForageItem(key, draftSubmission)
}

export async function removeLocalDraftSubmission(
  formSubmissionDraftId: undefined | null | string,
): Promise<void> {
  if (!formSubmissionDraftId) {
    return
  }
  const key = getLocalDraftSubmissionKey(formSubmissionDraftId)
  return utilsService.removeLocalForageItem(key)
}

export async function saveDraftSubmission({
  draftSubmission,
  autoSaveKey,
  onProgress,
  abortSignal,
  skipUpload,
}: {
  draftSubmission: DraftSubmission
  autoSaveKey: string | undefined
  onProgress?: ProgressListener
  abortSignal?: AbortSignal
  skipUpload?: boolean
}): Promise<SubmissionTypes.FormSubmissionDraftVersion | undefined> {
  await setLocalDraftSubmission(draftSubmission)

  if (draftSubmission.backgroundUpload) {
    return
  }

  try {
    if (!skipUpload) {
      return await uploadDraftData(draftSubmission, onProgress, abortSignal)
    }
  } catch (error) {
    // Ignoring all errors here as we don't want draft submission data
    // being saved to the cloud to prevent drafts from being saved on the device
    console.warn('Could not upload Draft Data as JSON', error)
    Sentry.captureException(error)
  } finally {
    if (typeof autoSaveKey === 'string') {
      try {
        await deleteAutoSaveData(draftSubmission.definition.id, autoSaveKey)
      } catch (error) {
        console.warn('Error removing auto save data: ', error)
        Sentry.captureException(error)
      }
    }
  }
}

export async function deleteDraftData(
  formSubmissionDraftId: string,
  abortSignal?: AbortSignal,
): Promise<{ hasDeletedRemoteDraft: boolean }> {
  try {
    await deleteFormSubmissionDraft(formSubmissionDraftId, abortSignal)
    return {
      hasDeletedRemoteDraft: true,
    }
  } catch (error) {
    console.warn(
      'Could not delete remote draft, will attempt to delete again later.',
      error,
    )
    return {
      hasDeletedRemoteDraft: false,
    }
  }
}

export function getLatestFormSubmissionDraftVersion(
  versions: SubmissionTypes.FormSubmissionDraftVersion[] | undefined,
) {
  return versions?.reduce<
    SubmissionTypes.FormSubmissionDraftVersion | undefined
  >((memo, formSubmissionDraftVersion) => {
    if (!memo || formSubmissionDraftVersion.createdAt > memo.createdAt) {
      return formSubmissionDraftVersion
    }
    return memo
  }, undefined)
}

export async function getDraftSubmission(
  formSubmissionDraft: SubmissionTypes.FormSubmissionDraft,
  abortSignal?: AbortSignal,
): Promise<DraftSubmission | undefined> {
  const latestFormSubmissionDraftVersion = getLatestFormSubmissionDraftVersion(
    formSubmissionDraft.versions,
  )
  const draftSubmission = await getLocalDraftSubmission(formSubmissionDraft.id)

  // If there is local data and no server data, return local data.
  // Or if the latest server version of the draft is what
  // is currently saved locally, return local data.
  if (
    draftSubmission &&
    (!latestFormSubmissionDraftVersion ||
      latestFormSubmissionDraftVersion.createdAt <= draftSubmission.createdAt)
  ) {
    return draftSubmission
  }

  if (!latestFormSubmissionDraftVersion) {
    return undefined
  }

  //drafts will always have a formsAppId
  const s3SubmissionData = (await downloadDraftData(
    latestFormSubmissionDraftVersion.id,
    abortSignal,
  )) as Omit<SubmissionTypes.S3SubmissionData, 'formsAppId'> & {
    formsAppId: number
  }
  return await setLocalDraftSubmission({
    definition: s3SubmissionData.definition,
    submission: s3SubmissionData.submission,
    lastElementUpdated: s3SubmissionData.lastElementUpdated,
    formsAppId: s3SubmissionData.formsAppId,
    jobId: formSubmissionDraft.jobId,
    externalId: formSubmissionDraft.externalId,
    previousFormSubmissionApprovalId:
      formSubmissionDraft.previousFormSubmissionApprovalId,
    taskCompletion: s3SubmissionData.task &&
      s3SubmissionData.taskAction && {
        task: s3SubmissionData.task,
        taskAction: s3SubmissionData.taskAction,
        taskGroup: s3SubmissionData.taskGroup,
        taskGroupInstance: s3SubmissionData.taskGroupInstance,
        redirectUrl: '',
      },
    title: latestFormSubmissionDraftVersion.title,
    createdAt: latestFormSubmissionDraftVersion.createdAt,
    formSubmissionDraftId: formSubmissionDraft.id,
    sectionState: s3SubmissionData.sectionState,
    previousElapsedDurationSeconds:
      s3SubmissionData.previousElapsedDurationSeconds,
  })
}
