import { v4 as uuidv4 } from 'uuid'
import _orderBy from 'lodash.orderby'
import utilsService from './services/utils'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import { getUsername } from './services/cognito'
import { getFormsKeyId, getCurrentFormsAppUser } from './auth-service'
import { getFormSubmissionDrafts, uploadDraftData } from './services/api/drafts'
import {
  getPendingQueueSubmissions,
  deletePendingQueueSubmission,
} from './services/pending-queue'
import {
  deleteDraftData,
  getDraftSubmission,
  getLatestFormSubmissionDraftVersion,
  getLocalDraftSubmission,
  removeLocalDraftSubmission,
  saveDraftSubmission,
} from './services/draft-data-store'
import { SubmissionTypes } from '@oneblink/types'
import Sentry from './Sentry'
import {
  DraftSubmission,
  DraftSubmissionInput,
  LocalFormSubmissionDraft,
  ProgressListener,
} from './types/submissions'

function generateDraftsKey(username: string) {
  return `V2_DRAFTS_${username}`
}

function generatePublicDraftsKey() {
  return `V2_DRAFTS_PUBLIC`
}

interface LocalDraftsStorage {
  deletedFormSubmissionDrafts: SubmissionTypes.FormSubmissionDraft[]
  unsyncedDraftSubmissions: DraftSubmission[]
  syncedFormSubmissionDrafts: SubmissionTypes.FormSubmissionDraft[]
}

async function checkIfUsingPrivateDrafts(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<boolean> {
  return getCurrentFormsAppUser(formsAppId, abortSignal)
    .then((user) => !!user)
    .catch((error) => {
      if (error.status >= 400 && error.status < 500) {
        return false
      } else {
        Sentry.captureException(error)
        console.log(
          'Could not determine if the current user has access to this forms app',
          error,
        )
        return false
      }
    })
}

function generateLocalFormSubmissionDraftsFromDraftSubmissions(
  draftSubmissions: DraftSubmission[],
  pendingSubmissionsDraftIds: Set<string>,
  deletedDraftIds: Set<string>,
) {
  const localFormSubmissionDraftsMap = new Map<
    string,
    LocalFormSubmissionDraft
  >()

  for (const draftSubmission of draftSubmissions) {
    if (
      // Remove drafts that are in the pending queue
      !pendingSubmissionsDraftIds.has(draftSubmission.formSubmissionDraftId) &&
      // Remove any drafts deleted while offline
      !deletedDraftIds.has(draftSubmission.formSubmissionDraftId)
    ) {
      localFormSubmissionDraftsMap.set(draftSubmission.formSubmissionDraftId, {
        formsAppId: draftSubmission.formsAppId,
        formId: draftSubmission.definition.id,
        externalId: draftSubmission.externalId,
        jobId: draftSubmission.jobId,
        previousFormSubmissionApprovalId:
          draftSubmission.previousFormSubmissionApprovalId,
        taskId: draftSubmission.taskCompletion?.task.taskId,
        taskGroupInstanceId:
          draftSubmission.taskCompletion?.taskGroupInstance
            ?.taskGroupInstanceId,
        taskActionId: draftSubmission.taskCompletion?.taskAction.taskActionId,
        draftSubmission,
        versions: undefined,
      })
    }
  }

  return localFormSubmissionDraftsMap
}

async function getPendingSubmissionsDraftIds() {
  const pendingSubmissions = await getPendingQueueSubmissions()
  return pendingSubmissions.reduce<Set<string>>((memo, pendingSubmission) => {
    if (pendingSubmission.formSubmissionDraftId) {
      memo.add(pendingSubmission.formSubmissionDraftId)
    }
    return memo
  }, new Set<string>())
}

async function generatePublicLocalFormSubmissionDraftsFromStorage(
  publicDraftsStorage: DraftSubmission[],
) {
  const pendingSubmissionsDraftIds = await getPendingSubmissionsDraftIds()
  const localFormSubmissionDraftsMap =
    generateLocalFormSubmissionDraftsFromDraftSubmissions(
      publicDraftsStorage,
      pendingSubmissionsDraftIds,
      new Set(),
    )

  const localFormSubmissionDrafts = Array.from(
    localFormSubmissionDraftsMap.values(),
  )

  return _orderBy(localFormSubmissionDrafts, (localFormSubmissionDraft) => {
    return localFormSubmissionDraft.draftSubmission?.createdAt
  })
}

async function generateLocalFormSubmissionDraftsFromStorage(
  localDraftsStorage: LocalDraftsStorage,
): Promise<LocalFormSubmissionDraft[]> {
  const pendingSubmissionsDraftIds = await getPendingSubmissionsDraftIds()
  const deletedDraftIds = new Set(
    localDraftsStorage.deletedFormSubmissionDrafts.map(({ id }) => id),
  )

  const localFormSubmissionDraftsMap =
    generateLocalFormSubmissionDraftsFromDraftSubmissions(
      localDraftsStorage.unsyncedDraftSubmissions,
      pendingSubmissionsDraftIds,
      deletedDraftIds,
    )

  for (const formSubmissionDraft of localDraftsStorage.syncedFormSubmissionDrafts) {
    if (
      // Unsycned version of draft takes priority over the synced version
      !localFormSubmissionDraftsMap.has(formSubmissionDraft.id) &&
      // Remove drafts that are in the pending queue
      !pendingSubmissionsDraftIds.has(formSubmissionDraft.id) &&
      // Remove any drafts deleted while offline
      !deletedDraftIds.has(formSubmissionDraft.id)
    ) {
      const draftSubmission = await getDraftSubmission(
        formSubmissionDraft,
      ).catch((err) => {
        console.warn(
          `Could not fetch draft submission for draft: ${formSubmissionDraft.id}`,
          err,
        )
        return undefined
      })
      localFormSubmissionDraftsMap.set(formSubmissionDraft.id, {
        ...formSubmissionDraft,
        draftSubmission,
      })
    }
  }

  const localFormSubmissionDrafts = Array.from(
    localFormSubmissionDraftsMap.values(),
  )

  return _orderBy(localFormSubmissionDrafts, (localFormSubmissionDraft) => {
    return (
      localFormSubmissionDraft.draftSubmission?.createdAt ||
      getLatestFormSubmissionDraftVersion(localFormSubmissionDraft.versions)
        ?.createdAt
    )
  })
}

function errorHandler(error: Error): Error {
  console.error('Local Forage Error', error)
  if (/The serialized value is too large/.test(error.message)) {
    return new OneBlinkAppsError(
      'It seems you have run out of space. Please delete some of your drafts to allow new drafts to be created or existing drafts to be updated.',
      {
        originalError: error,
      },
    )
  }

  return error
}

const draftsListeners: Array<(drafts: LocalFormSubmissionDraft[]) => unknown> =
  []

/**
 * Register a listener function that will be passed an array of Drafts when a
 * draft is added, updated or deleted.
 *
 * #### Example
 *
 * ```js
 * const listener = async (drafts) => {
 *   // use drafts here...
 * }
 * const deregister = await draftService.registerDraftsListener(listener)
 *
 * // When no longer needed, remember to deregister the listener
 * deregister()
 * ```
 *
 * @param listener
 * @returns
 */
function registerDraftsListener(
  listener: (drafts: LocalFormSubmissionDraft[]) => unknown,
): () => void {
  draftsListeners.push(listener)

  return () => {
    const index = draftsListeners.indexOf(listener)
    if (index !== -1) {
      draftsListeners.splice(index, 1)
    }
  }
}

async function executeDraftsListeners(
  localFormSubmissionDrafts: LocalFormSubmissionDraft[],
) {
  for (const draftsListener of draftsListeners) {
    draftsListener(localFormSubmissionDrafts)
  }
}

/**
 * Create or update a Draft in the local store and sync it with remote drafts.
 * Will also handle cleaning up auto save data (if the `autoSaveKey` property is
 * passed).
 *
 * #### Example
 *
 * ```js
 * const abortController = new AbortController()
 * const formSubmissionDraftId = 'd3aeb944-d0b3-11ea-87d0-0242ac130003' // pass `undefined` to create a new draft
 * const autoSaveKey = 'SET ME TO DELETE AUTOSAVE DATA AFTER SAVING DRAFT'
 * const draftSubmissionInput = {
 *   title: 1,
 *   formsAppId: 1,
 *   submission: {
 *     form: 'data',
 *     goes: 'here',
 *   },
 *   definition: {
 *     form: 'definition',
 *     goes: 'here',
 *   },
 * }
 * await draftService.upsertDraft({
 *   formSubmissionDraftId,
 *   autoSaveKey,
 *   draftSubmissionInput,
 *   abortSignal: abortController.signal,
 *   onProgress: (progress) => {
 *     // ...
 *   },
 * })
 * ```
 *
 * @param options
 * @returns
 */
async function upsertDraft({
  formSubmissionDraftId,
  draftSubmissionInput,
  autoSaveKey,
  onProgress,
  abortSignal,
  pendingTimestamp,
}: {
  formSubmissionDraftId: string | undefined
  draftSubmissionInput: DraftSubmissionInput
  autoSaveKey?: string
  onProgress?: ProgressListener
  abortSignal?: AbortSignal
  pendingTimestamp?: string
}): Promise<void> {
  const draftSubmission: DraftSubmission = {
    ...draftSubmissionInput,
    createdAt: new Date().toISOString(),
    formSubmissionDraftId: formSubmissionDraftId || uuidv4(),
  }

  const keyId = getFormsKeyId()
  if (keyId) {
    if (isOffline()) {
      throw new OneBlinkAppsError('Drafts cannot be saved while offline.', {
        isOffline: true,
      })
    }

    await uploadDraftData(draftSubmission, onProgress, abortSignal)
    return
  }

  try {
    const isUsingPrivateDrafts = await checkIfUsingPrivateDrafts(
      draftSubmission.formsAppId,
    )
    const formSubmissionDraftVersion = await saveDraftSubmission({
      draftSubmission,
      autoSaveKey,
      onProgress,
      skipUpload: !isUsingPrivateDrafts,
    })

    if (isUsingPrivateDrafts) {
      const localDraftsStorage = await getLocalDraftsFromStorage()

      if (formSubmissionDraftVersion) {
        console.log('Draft was saved on server', formSubmissionDraftVersion)
        localDraftsStorage.syncedFormSubmissionDrafts =
          await getFormSubmissionDrafts(draftSubmission.formsAppId, abortSignal)
        // Remove draft from unsynced incase it was created offline
        if (formSubmissionDraftId) {
          localDraftsStorage.unsyncedDraftSubmissions =
            localDraftsStorage.unsyncedDraftSubmissions.filter(
              (unsyncedDraftSubmission) =>
                unsyncedDraftSubmission.formSubmissionDraftId !==
                formSubmissionDraftId,
            )
        }
      } else {
        console.log(
          'Draft could not be saved on server, saving locally to sync later',
          draftSubmission,
        )
        let updated = false

        if (formSubmissionDraftId) {
          localDraftsStorage.unsyncedDraftSubmissions =
            localDraftsStorage.unsyncedDraftSubmissions.map(
              (unsyncedDraftSubmission) => {
                if (
                  unsyncedDraftSubmission.formSubmissionDraftId ===
                  formSubmissionDraftId
                ) {
                  updated = true
                  return draftSubmission
                }
                return unsyncedDraftSubmission
              },
            )
          // Remove draft from synced drafts incase it was retrieved while online
          localDraftsStorage.syncedFormSubmissionDrafts =
            localDraftsStorage.syncedFormSubmissionDrafts.filter(
              ({ id }) => id !== formSubmissionDraftId,
            )
        }

        if (!updated) {
          localDraftsStorage.unsyncedDraftSubmissions.push(draftSubmission)
        }
      }

      await setAndBroadcastDrafts(localDraftsStorage)
    } else {
      let updated = false
      const publicDraftsStorage = (await getPublicDraftsFromStorage()).map(
        (publicDraftSubmission) => {
          if (
            publicDraftSubmission.formSubmissionDraftId ===
            formSubmissionDraftId
          ) {
            updated = true
            return draftSubmission
          }
          return publicDraftSubmission
        },
      )
      if (!updated) {
        publicDraftsStorage.push(draftSubmission)
      }
      await setAndBroadcastPublicDrafts(publicDraftsStorage)
    }

    if (pendingTimestamp) {
      await deletePendingQueueSubmission(pendingTimestamp)
    }
    syncDrafts({
      throwError: false,
      formsAppId: draftSubmission.formsAppId,
    })
  } catch (err) {
    Sentry.captureException(err)
    throw errorHandler(err as Error)
  }
}

async function getLocalDraftsFromStorage(): Promise<LocalDraftsStorage> {
  const username = getUsername()
  if (username) {
    try {
      const localDraftsStorage =
        await utilsService.localForage.getItem<LocalDraftsStorage>(
          generateDraftsKey(username),
        )
      if (localDraftsStorage) {
        return localDraftsStorage
      }
    } catch (err) {
      Sentry.captureException(err)
      throw errorHandler(err as Error)
    }
  }

  return {
    unsyncedDraftSubmissions: [],
    syncedFormSubmissionDrafts: [],
    deletedFormSubmissionDrafts: [],
  }
}

async function getPublicDraftsFromStorage(): Promise<DraftSubmission[]> {
  try {
    const publicDrafts = await utilsService.localForage.getItem<
      DraftSubmission[]
    >(generatePublicDraftsKey())
    if (publicDrafts) {
      return publicDrafts
    }
  } catch (err) {
    Sentry.captureException(err)
    throw errorHandler(err as Error)
  }

  return []
}

/**
 * Get an array of Drafts for the currently logged in user.
 *
 * #### Example
 *
 * ```js
 * const drafts = await draftService.getDrafts()
 * ```
 *
 * @returns
 */
async function getDrafts(): Promise<LocalFormSubmissionDraft[]> {
  const localDraftsStorage = await getLocalDraftsFromStorage()
  return await generateLocalFormSubmissionDraftsFromStorage(localDraftsStorage)
}

/**
 * Get an array of Drafts that have been submitted publicly on this device.
 *
 * #### Example
 *
 * ```js
 * const drafts = await draftService.getPublicDrafts()
 * ```
 *
 * @returns
 */
async function getPublicDrafts(): Promise<LocalFormSubmissionDraft[]> {
  const publicDraftsStorage = await getPublicDraftsFromStorage()
  return await generatePublicLocalFormSubmissionDraftsFromStorage(
    publicDraftsStorage,
  )
}

async function tryGetFormSubmissionDrafts(
  formsAppId: number,
  abortSignal: AbortSignal | undefined,
) {
  try {
    return await getFormSubmissionDrafts(formsAppId, abortSignal)
  } catch (error) {
    if (!(error instanceof OneBlinkAppsError) || !error.isOffline) {
      throw error
    }
  }
}

/**
 * Get a single Draft and the associated submission data.
 *
 * #### Example
 *
 * ```js
 * const draftId = 'd3aeb944-d0b3-11ea-87d0-0242ac130003'
 * const { draft, draftData, lastElementUpdated } =
 *   await draftService.getDraftAndData(draftId)
 * // use "draftData" to prefill a from
 * ```
 *
 * @param draftId
 * @returns
 */
async function getDraftAndData(
  formsAppId: number,
  formSubmissionDraftId: string | undefined | null,
  abortSignal: AbortSignal | undefined,
): Promise<DraftSubmission | undefined> {
  if (!formSubmissionDraftId) {
    return
  }

  let formSubmissionDrafts = await tryGetFormSubmissionDrafts(
    formsAppId,
    abortSignal,
  )
  const isUsingPrivateDrafts = await checkIfUsingPrivateDrafts(formsAppId)
  if (isUsingPrivateDrafts) {
    const localDraftsStorage = await getLocalDraftsFromStorage()
    if (formSubmissionDrafts) {
      localDraftsStorage.syncedFormSubmissionDrafts = formSubmissionDrafts
      await setAndBroadcastDrafts(localDraftsStorage)
    } else {
      formSubmissionDrafts = localDraftsStorage.syncedFormSubmissionDrafts
    }

    const formSubmissionDraft = formSubmissionDrafts.find(
      ({ id }) => id === formSubmissionDraftId,
    )
    if (!formSubmissionDraft) {
      return (await getLocalDraftSubmission(formSubmissionDraftId)) || undefined
    }

    return await getDraftSubmission(formSubmissionDraft)
  } else {
    if (formSubmissionDrafts) {
      return (await getLocalDraftSubmission(formSubmissionDraftId)) || undefined
    }
  }
}

/**
 * Remove a draft from the local store and sync with remote drafts.
 *
 * #### Example
 *
 * ```js
 * const draftId = 'd3aeb944-d0b3-11ea-87d0-0242ac130003'
 * await draftService.deleteDraft(draftId)
 * ```
 *
 * @param draftId
 * @param formsAppId
 * @returns
 */
async function deleteDraft(
  formSubmissionDraftId: string,
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<void> {
  try {
    await removeLocalDraftSubmission(formSubmissionDraftId)
    const isUsingPrivateDrafts = await checkIfUsingPrivateDrafts(formsAppId)
    if (isUsingPrivateDrafts) {
      const localDraftsStorage = await getLocalDraftsFromStorage()
      const formSubmissionDraft =
        localDraftsStorage.syncedFormSubmissionDrafts.find(
          ({ id }) => id === formSubmissionDraftId,
        )
      if (formSubmissionDraft) {
        const { hasDeletedRemoteDraft } = await deleteDraftData(
          formSubmissionDraftId,
          abortSignal,
        )
        localDraftsStorage.syncedFormSubmissionDrafts =
          localDraftsStorage.syncedFormSubmissionDrafts.filter(
            ({ id }) => id !== formSubmissionDraft.id,
          )
        if (!hasDeletedRemoteDraft) {
          localDraftsStorage.deletedFormSubmissionDrafts.push(
            formSubmissionDraft,
          )
        }
      } else {
        console.log(
          'Could not find existing draft in synced drafts to delete',
          {
            formSubmissionDraftId,
            localDraftsStorage,
          },
        )
        const draftSubmission =
          localDraftsStorage.unsyncedDraftSubmissions.find(
            (draftSubmission) =>
              draftSubmission.formSubmissionDraftId === formSubmissionDraftId,
          )
        if (!draftSubmission) {
          return
        }

        localDraftsStorage.unsyncedDraftSubmissions =
          localDraftsStorage.unsyncedDraftSubmissions.filter(
            (draftSubmission) =>
              draftSubmission.formSubmissionDraftId !== formSubmissionDraftId,
          )
      }

      await setAndBroadcastDrafts(localDraftsStorage)
    } else {
      let publicDraftsStorage = await getPublicDraftsFromStorage()
      const draftSubmission = publicDraftsStorage.find(
        (draftSubmission) =>
          draftSubmission.formSubmissionDraftId === formSubmissionDraftId,
      )
      if (!draftSubmission) {
        return
      }

      publicDraftsStorage = publicDraftsStorage.filter(
        (draftSubmission) =>
          draftSubmission.formSubmissionDraftId !== formSubmissionDraftId,
      )

      await setAndBroadcastPublicDrafts(publicDraftsStorage)
    }

    syncDrafts({
      throwError: false,
      formsAppId,
    })
  } catch (err) {
    Sentry.captureException(err)
    throw errorHandler(err as Error)
  }
}

async function setAndBroadcastPublicDrafts(publicDrafts: DraftSubmission[]) {
  await utilsService.localForage.setItem(
    generatePublicDraftsKey(),
    publicDrafts,
  )

  console.log('Public drafts have been updated', publicDrafts)
  const localFormSubmissionDrafts =
    await generatePublicLocalFormSubmissionDraftsFromStorage(publicDrafts)
  await executeDraftsListeners(
    localFormSubmissionDrafts.map((draft) => ({ ...draft, isPublic: true })),
  )
}

async function setAndBroadcastDrafts(
  localDraftsStorage: LocalDraftsStorage,
): Promise<void> {
  const username = getUsername()
  if (!username) {
    throw new OneBlinkAppsError(
      'You cannot set your drafts until you have logged in. Please login and try again.',
      {
        requiresLogin: true,
      },
    )
  }
  await utilsService.localForage.setItem(
    generateDraftsKey(username),
    localDraftsStorage,
  )

  console.log('Drafts have been updated', localDraftsStorage)
  const localFormSubmissionDrafts =
    await generateLocalFormSubmissionDraftsFromStorage(localDraftsStorage)
  await executeDraftsListeners(localFormSubmissionDrafts)
}

let _isSyncingDrafts = false

/**
 * Force a sync of remote drafts with locally stored drafts. This function will
 * swallow all errors thrown unless `true` is passed for the `throwError`
 * property.
 *
 * #### Example
 *
 * ```js
 * await draftService.syncDrafts({
 *   throwError: true,
 *   formsAppId: 1,
 * })
 * ```
 *
 * @param param0
 * @returns
 */
async function syncDrafts({
  formsAppId,
  throwError,
  abortSignal,
}: {
  /** The id of the OneBlink Forms App to sync drafts with */
  formsAppId: number
  /** `true` to throw errors while syncing */
  throwError?: boolean
  /** Signal to abort the requests */
  abortSignal?: AbortSignal
}): Promise<void> {
  if (_isSyncingDrafts) {
    console.log('Application is currently syncing drafts.')
    return
  }
  _isSyncingDrafts = true

  const isUsingPrivateDrafts = await checkIfUsingPrivateDrafts(formsAppId)

  if (!isUsingPrivateDrafts) {
    const publicDrafts = await getPublicDraftsFromStorage()
    const filteredPublicDrafts = []
    // iterate through public draft records, and check if a draft submission exists for each record.
    // If no draft submission exists for a record, the draft was likely submitted, so we must remove it
    // from the list of public drafts so it no longer appears in the user's draft list.
    for (const publicDraft of publicDrafts) {
      const localDraftSubmission = await getLocalDraftSubmission(
        publicDraft.formSubmissionDraftId,
      )
      if (localDraftSubmission) {
        filteredPublicDrafts.push(publicDraft)
      }
    }
    await setAndBroadcastPublicDrafts(filteredPublicDrafts)
    _isSyncingDrafts = false
    return
  }

  try {
    let localDraftsStorage = await getLocalDraftsFromStorage()
    if (localDraftsStorage.deletedFormSubmissionDrafts.length) {
      console.log(
        'Removing local draft data for deleted drafts',
        localDraftsStorage.deletedFormSubmissionDrafts,
      )
      const newDeletedFormSubmissionDrafts: SubmissionTypes.FormSubmissionDraft[] =
        []
      for (const formSubmissionDraft of localDraftsStorage.deletedFormSubmissionDrafts) {
        const { hasDeletedRemoteDraft } = await deleteDraftData(
          formSubmissionDraft.id,
          abortSignal,
        )
        if (!hasDeletedRemoteDraft) {
          newDeletedFormSubmissionDrafts.push(formSubmissionDraft)
        }
      }

      // Get local drafts again to ensure nothing has happened while processing
      localDraftsStorage = await getLocalDraftsFromStorage()
      localDraftsStorage.deletedFormSubmissionDrafts =
        newDeletedFormSubmissionDrafts
    }

    const publicDraftsStorage = await getPublicDraftsFromStorage()
    // if public drafts exist, add them to the current logged in users' unsynced drafts
    // and remove them from local storage
    if (publicDraftsStorage.length) {
      localDraftsStorage.unsyncedDraftSubmissions.push(...publicDraftsStorage)
      await utilsService.localForage.setItem(generatePublicDraftsKey(), [])
    }

    if (localDraftsStorage.unsyncedDraftSubmissions.length) {
      console.log(
        `Attempting to upload ${localDraftsStorage.unsyncedDraftSubmissions.length} local unsynced drafts(s).`,
      )
      const newUnsyncedDraftSubmissions: DraftSubmission[] = []
      for (const draftSubmission of localDraftsStorage.unsyncedDraftSubmissions) {
        console.log(
          'Uploading draft data that was saved while offline',
          draftSubmission.title,
        )
        draftSubmission.backgroundUpload = false
        const formSubmissionDraftVersion = await saveDraftSubmission({
          draftSubmission,
          autoSaveKey: undefined,
          abortSignal,
          skipUpload: !isUsingPrivateDrafts,
        })
        if (!formSubmissionDraftVersion) {
          newUnsyncedDraftSubmissions.push(draftSubmission)
        }
      }
      // Get local drafts again to ensure nothing has happened while processing
      localDraftsStorage = await getLocalDraftsFromStorage()
      localDraftsStorage.unsyncedDraftSubmissions = newUnsyncedDraftSubmissions
    }

    const formSubmissionDrafts = await tryGetFormSubmissionDrafts(
      formsAppId,
      abortSignal,
    )
    if (formSubmissionDrafts) {
      localDraftsStorage.syncedFormSubmissionDrafts = formSubmissionDrafts
    }

    await setAndBroadcastDrafts(localDraftsStorage)

    if (localDraftsStorage.syncedFormSubmissionDrafts.length) {
      console.log(
        'Ensuring all draft data is available for offline use for synced drafts',
        localDraftsStorage.syncedFormSubmissionDrafts,
      )
      for (const formSubmissionDraft of localDraftsStorage.syncedFormSubmissionDrafts) {
        await getDraftSubmission(formSubmissionDraft, abortSignal).catch(
          (error) => {
            console.warn('Could not download Draft Data as JSON', error)
          },
        )
      }
    }

    console.log('Finished syncing drafts.')
    _isSyncingDrafts = false
  } catch (error) {
    _isSyncingDrafts = false
    if (abortSignal?.aborted) {
      console.log('Syncing drafts has been aborted')
      return
    }
    console.warn(
      'Error while attempting to sync and update local drafts',
      error,
    )
    if (!(error instanceof OneBlinkAppsError)) {
      Sentry.captureException(error)
    }
    if (throwError) {
      throw error
    }
  }
}

export {
  registerDraftsListener,
  upsertDraft,
  getDraftAndData,
  getDrafts,
  getPublicDrafts,
  deleteDraft,
  syncDrafts,
  getLatestFormSubmissionDraftVersion,
  LocalFormSubmissionDraft,
}
