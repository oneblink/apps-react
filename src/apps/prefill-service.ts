import utilsService from './services/utils'
import { getPrefillKey, getPrefillFormData } from './services/job-prefill'

/**
 * Remove prefill data form the local store.
 *
 * ```js
 * const prefillFormDataId = '24faee0a-dca1-4c88-9100-9da2aae8e0ac'
 * await prefillService.removePrefillFormData(prefillFormDataId)
 * ```
 *
 * @param prefillFormDataId
 * @returns
 */
export async function removePrefillFormData(
  prefillFormDataId: string,
): Promise<void> {
  const key = getPrefillKey(prefillFormDataId)
  return utilsService.removeLocalForageItem(key)
}

export { getPrefillFormData }
