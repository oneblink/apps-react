import utilsService from './utils'
import { downloadPreFillFormData } from './api/prefill'
import { SubmissionTypes } from '@oneblink/types'

export function getPrefillKey(prefillFormDataId: string) {
  return `V2_PREFILL_${prefillFormDataId}`
}

function get<T>(prefillFormDataId: string): Promise<T | null> {
  const key = getPrefillKey(prefillFormDataId)
  return utilsService.getLocalForageItem(key)
}

function set<T extends Record<string, unknown>>(
  prefillFormDataId: string,
  model: T,
): Promise<T> {
  const key = getPrefillKey(prefillFormDataId)
  return utilsService.setLocalForageItem(key, model)
}

/**
 * Get prefill data for a form. Checks if the data is stored locally first, and
 * then downloads from remote if required. After a successful download from the
 * remote store, it will store is locally to ensure the next request will
 * retrieve the data from the local store.
 *
 * ```js
 * const formId = 1
 * const prefillFormDataId = '24faee0a-dca1-4c88-9100-9da2aae8e0ac'
 * const prefillData = await prefillService.getPrefillFormData(
 *   formId,
 *   prefillFormDataId,
 * )
 * if (prefillData) {
 *   // prefill form with data
 * }
 * ```
 *
 * @param formId
 * @param prefillFormDataId
 * @returns
 */
export async function getPrefillFormData<T extends Record<string, unknown>>(
  formId: number,
  prefillFormDataId: string | undefined | null,
): Promise<T | null> {
  if (!prefillFormDataId) {
    return null
  }

  return get<T>(prefillFormDataId).then((prefillData) => {
    if (prefillData) return prefillData

    return downloadPreFillFormData<T>(formId, prefillFormDataId).then(
      (downloadedPrefillData) =>
        set<T>(prefillFormDataId, downloadedPrefillData),
    )
  })
}

/**
 * Helper to store Job prefill data locally if it is not currently in the local
 * store. Pass in an array of Jobs.
 *
 * #### Example
 *
 * ```js
 * const jobs = [...]
 * await jobService.ensurePrefillFormDataExists(jobs)
 * ```
 *
 * @param jobs
 * @returns
 */
export async function ensurePrefillFormDataExists(
  jobs: SubmissionTypes.FormsAppJob[],
): Promise<void> {
  if (!jobs.length) {
    return
  }

  const keys = await utilsService.localForage.keys()
  for (const { formId, preFillFormDataId } of jobs) {
    if (
      !preFillFormDataId ||
      keys.some((key) => key === getPrefillKey(preFillFormDataId))
    ) {
      continue
    }
    try {
      await getPrefillFormData(formId, preFillFormDataId)
    } catch (error) {
      console.warn('Suppressing error retrieving prefill data for jobs', error)
    }
  }
}
