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
 * Whether an audience can change this element or anything nested inside it.
 *
 * Approvers may only edit elements configured for approver editing, so a
 * subtree containing none of them is entirely locked for them. Used to skip
 * validating what an audience has no way to correct.
 */
export function isElementEditableForAudience(
  element: FormTypes.FormElement,
  audience: FormTypes.FormElementHiddenFromAudience,
): boolean {
  if (audience !== 'APPROVER') {
    return true
  }

  return (
    isApproverEditable(element) ||
    ('elements' in element &&
      Array.isArray(element.elements) &&
      hasApproverEditableElement(element.elements))
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
