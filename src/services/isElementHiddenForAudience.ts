import { FormTypes } from '@oneblink/types'

/**
 * Determine whether a form element should be visually hidden for a given
 * audience.
 *
 * Hidden elements remain in the DOM, conditional logic, and submission data.
 *
 * - `isHidden` false or omitted: not hidden
 * - `isHidden` true and `hiddenFrom` omitted: hidden from all audiences
 * - `isHidden` true and `hiddenFrom` set: hidden only from the listed audiences
 */
export default function isElementHiddenForAudience(
  element: Pick<FormTypes._FormElementBase, 'isHidden' | 'hiddenFrom'>,
  audience: FormTypes.FormElementHiddenFromAudience,
): boolean {
  if (!element.isHidden) {
    return false
  }
  if (!element.hiddenFrom?.length) {
    return true
  }
  return element.hiddenFrom.includes(audience)
}
