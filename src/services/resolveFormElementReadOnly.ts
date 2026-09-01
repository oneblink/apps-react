import { FormTypes } from '@oneblink/types'
import isElementReadOnlyForAudience, {
  isApproverEditable,
} from './isElementReadOnlyForAudience'

/**
 * Whether a form element’s own controls should be locked for a given audience.
 *
 * `approverEditability` wins over the element’s `readOnly` flag for approvers,
 * so a field can be locked for submitters and still editable during review.
 * Whole-form read-only (`useFormIsReadOnly`) is applied by the renderer, not
 * here.
 */
export default function resolveFormElementReadOnly(
  element: FormTypes.FormElement,
  audience: FormTypes.FormElementHiddenFromAudience,
): boolean {
  if (audience === 'APPROVER' && isApproverEditable(element)) {
    return false
  }

  return (
    ('readOnly' in element && element.readOnly === true) ||
    isElementReadOnlyForAudience(element, audience)
  )
}
