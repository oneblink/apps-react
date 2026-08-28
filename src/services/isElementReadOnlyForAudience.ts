import { FormTypes } from '@oneblink/types'

export function isApproverEditable(element: FormTypes.FormElement): boolean {
  return (
    'approverEditability' in element &&
    element.approverEditability?.type === 'ALL_STEPS'
  )
}

function hasApproverEditableElement(
  elements: FormTypes.FormElement[],
): boolean {
  return elements.some(
    (element) =>
      isApproverEditable(element) ||
      ('elements' in element &&
        Array.isArray(element.elements) &&
        hasApproverEditableElement(element.elements)),
  )
}

/**
 * Determine whether a form element should be read only for a given audience.
 *
 * Approvers may only edit elements explicitly configured for approver editing,
 * so every other input is locked. Nested form and info page elements stay
 * interactive while they contain an approver editable element.
 */
export default function isElementReadOnlyForAudience(
  element: FormTypes.FormElement,
  audience: FormTypes.FormElementHiddenFromAudience,
): boolean {
  if (audience !== 'APPROVER') {
    return false
  }

  if (element.type === 'form' || element.type === 'infoPage') {
    return (
      !isApproverEditable(element) &&
      !hasApproverEditableElement(element.elements || [])
    )
  }

  return !isApproverEditable(element)
}
