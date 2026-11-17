import utilsService from './services/utils'

const defaultAutoSaveKey = 'NO_AUTO_SAVE_KEY'
const autosaveKeyPrefix = 'AUTO_SAVE_'

function getAutoSaveKey(
  formId: number,
  autoSaveKey: string | null | undefined,
) {
  return `${autosaveKeyPrefix}${formId}_${autoSaveKey || defaultAutoSaveKey}`
}

// Writes and deletes are run one at a time. A write is several storage
// operations, so a delete that starts part way through one would be undone
// by the rest of the write.
let queue: Promise<unknown> = Promise.resolve()
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task)
  queue = result.catch(() => {})
  return result
}

/**
 * Get keys for autosave data.
 *
 * #### Example
 *
 * ```js
 * const keys = await autoSaveService.getAutoSaveDataKeys()
 * if (keys.length) {
 *   // Display keys to user
 * }
 * ```
 *
 * @returns
 */
export async function getAutoSaveKeys(): Promise<string[]> {
  return await utilsService.getLocalForageKeys(autosaveKeyPrefix)
}

/**
 * Get saved data.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const myKey = 'my-key'
 * const prefillData = await autoSaveService.getAutoSaveData(formId, myKey)
 * if (prefillData) {
 *   // Ask user if they would like to continue with this prefill data.
 * }
 * ```
 *
 * @param formId
 * @param autoSaveKey
 * @returns
 */
export async function getAutoSaveData<T>(
  formId: number,
  autoSaveKey: string | null | undefined,
): Promise<T | null> {
  const key = getAutoSaveKey(formId, autoSaveKey)
  return utilsService.getLocalForageItem(key)
}

/**
 * Create or update saved data.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const myKey = 'my-key'
 * await autoSaveService.upsertAutoSaveData(formId, myKey, {
 *   form: 'data',
 *   goes: 'here',
 * })
 * ```
 *
 * @param formId
 * @param autoSaveKey
 * @param model
 * @returns
 */
export async function upsertAutoSaveData<T extends Record<string, unknown>>(
  formId: number,
  autoSaveKey: string | null | undefined,
  model: T,
): Promise<T> {
  const key = getAutoSaveKey(formId, autoSaveKey)
  return enqueue(() => utilsService.setLocalForageItem(key, model))
}

/**
 * Delete saved data, including the last element updated, section state and
 * elapsed duration saved alongside it.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const myKey = 'my-key'
 * await autoSaveService.deleteAutoSaveData(formId, myKey)
 * ```
 *
 * @param formId
 * @param autoSaveKey
 * @returns
 */
export async function deleteAutoSaveData(
  formId: number,
  autoSaveKey: string | null | undefined,
): Promise<void> {
  await enqueue(() =>
    Promise.all(
      [
        autoSaveKey,
        `LAST_ELEMENT_UPDATED_${autoSaveKey}`,
        `SECTION_STATE_${autoSaveKey}`,
        `PREVIOUS_ELAPSED_DURATION_${autoSaveKey}`,
      ].map((key) =>
        utilsService.removeLocalForageItem(getAutoSaveKey(formId, key)),
      ),
    ),
  )
}

/**
 * Delete all auto saved data.
 *
 * #### Example
 *
 * ```js
 * await autoSaveService.deleteAllAutosaveData()
 * ```
 *
 * @returns
 */
export async function deleteAllAutosaveData() {
  await enqueue(async () => {
    const keys = await getAutoSaveKeys()
    console.log('Deleting all autosave data from local forage...')
    await Promise.all(keys.map((k) => utilsService.removeLocalForageItem(k)))
    console.log('All Autosave data deleted from local forage successfully.')
  })
}
