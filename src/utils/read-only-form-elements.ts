import { FormTypes } from '@oneblink/types'

type FormElementWithEditability =
  | FormTypes.FormElement
  | FormTypes.LookupFormElement

export function checkIsFormElementIdEditable(
  element: FormElementWithEditability,
  editableFormElementIds?: string[],
): boolean {
  return editableFormElementIds?.includes(element.id) === true
}

function checkHasEditableFormElement(
  elements: FormTypes.FormElement[],
  editableFormElementIds?: string[],
): boolean {
  return elements.some(
    (element) =>
      checkIsFormElementIdEditable(element, editableFormElementIds) ||
      ('elements' in element &&
        Array.isArray(element.elements) &&
        checkHasEditableFormElement(
          element.elements,
          editableFormElementIds,
        )),
  )
}

/**
 * Whether this element, or anything nested inside it, can be changed.
 *
 * When `editableFormElementIds` is omitted, every element is treated as
 * editable. When it is provided, only listed ids and containers that wrap them
 * are editable. Used to skip validating what the user has no way to correct.
 */
export function checkIsFormElementEditable(
  element: FormElementWithEditability,
  editableFormElementIds?: string[],
): boolean {
  if (editableFormElementIds === undefined) {
    return true
  }

  return (
    checkIsFormElementIdEditable(element, editableFormElementIds) ||
    ('elements' in element &&
      Array.isArray(element.elements) &&
      checkHasEditableFormElement(element.elements, editableFormElementIds))
  )
}

/**
 * Whether a form element’s own controls should be locked.
 *
 * An id in `editableFormElementIds` always wins. When that list is provided,
 * every other element is locked (whitelist). Otherwise the whole-form read-only
 * flag and the element’s own `readOnly` apply.
 */
export function checkIsFormElementReadOnly(
  element: FormElementWithEditability,
  {
    isFormReadOnly,
    isInheritedReadOnly,
    editableFormElementIds,
  }: {
    isFormReadOnly?: boolean
    isInheritedReadOnly?: boolean
    editableFormElementIds?: string[]
  } = {},
): boolean {
  if (checkIsFormElementIdEditable(element, editableFormElementIds)) {
    return false
  }

  if (editableFormElementIds !== undefined) {
    return true
  }

  if (isFormReadOnly || isInheritedReadOnly) {
    return true
  }

  return 'readOnly' in element && element.readOnly === true
}

/**
 * Whether lookups (and reverse geocode) must not run for this element.
 *
 * Definition `readOnly` and inherited container locks still allow submitter
 * lookups from prefills, defaults, and chained lookup buttons. Lookups are
 * blocked on a read-only form, or when a whitelist is provided and this id is
 * not on it (an approver must not re-run a lookup that could overwrite
 * persisted answers). An id in the whitelist always wins.
 */
export function checkAreLookupsDisallowed(
  element: FormElementWithEditability,
  {
    isFormReadOnly,
    editableFormElementIds,
  }: {
    isFormReadOnly?: boolean
    editableFormElementIds?: string[]
  } = {},
): boolean {
  if (checkIsFormElementIdEditable(element, editableFormElementIds)) {
    return false
  }

  if (editableFormElementIds !== undefined) {
    return true
  }

  return isFormReadOnly === true
}
