import { FormTypes } from '@oneblink/types'
import { getGeneratedByFormElementId } from '../services/dynamic-elements'

type FormElementWithEditability =
  | FormTypes.FormElement
  | FormTypes.LookupFormElement

export function checkIsFormElementIdEditable(
  element: FormElementWithEditability,
  editableFormElementIds?: string[],
): boolean {
  return editableFormElementIds?.includes(element.id) === true
}

/**
 * Returns the editable ids to provide while rendering or validating a nested
 * form. Nested forms get their own whitelist so an id reused by the parent form
 * cannot unlock a nested element (or vice versa).
 *
 * Selecting the nested form itself makes all of its descendants editable.
 */
export function getNestedEditableFormElementIds(
  formElement: FormTypes.FormFormElement,
  editableFormElementIds: string[] | undefined,
): string[] | undefined {
  if (editableFormElementIds === undefined) {
    return undefined
  }

  if (!editableFormElementIds.includes(formElement.id)) {
    return []
  }

  const nestedIds = new Set<string>()
  const addIds = (elements: FormTypes.FormElement[]) => {
    for (const element of elements) {
      nestedIds.add(element.id)
      if ('elements' in element && Array.isArray(element.elements)) {
        addIds(element.elements)
      }
    }
  }
  addIds(formElement.elements || [])
  return [...nestedIds]
}

/**
 * Expands a whitelist to cover the elements a lookup has injected into the
 * form. An element naming an editable id in `injectedByElementId` becomes
 * editable, as do its descendants, so an approver can correct answers that only
 * appeared after a lookup they are allowed to re-run. A dynamic element is
 * included whenever the element it was generated from is editable, since it
 * sits beside that element rather than within it.
 *
 * Only applies to the root whitelist; ids inside a nested form are scoped by
 * `getNestedEditableFormElementIds`. Returns `undefined` when no whitelist was
 * provided, matching the “everything is editable” convention used by the rest
 * of these helpers.
 */
export function expandEditableFormElementIds(
  editableFormElementIds: string[] | undefined,
  formElements: FormTypes.FormElement[],
): string[] | undefined {
  if (editableFormElementIds === undefined) {
    return undefined
  }

  const expanded = new Set(editableFormElementIds)

  const addInjected = (
    elements: FormTypes.FormElement[],
    isWithinInjectedElement = false,
  ) => {
    for (const element of elements) {
      const injectedByElementId = getInjectedByElementId(element)
      const generatedByFormElementId = getGeneratedByFormElementId(element)
      const isInjected =
        isWithinInjectedElement ||
        (injectedByElementId !== undefined && expanded.has(injectedByElementId))

      if (
        isInjected ||
        (generatedByFormElementId !== undefined &&
          expanded.has(generatedByFormElementId))
      ) {
        expanded.add(element.id)
      }

      if ('elements' in element && Array.isArray(element.elements)) {
        addInjected(element.elements, isInjected)
      }
    }
  }
  addInjected(formElements)

  return [...expanded]
}

function getInjectedByElementId(
  element: FormTypes.FormElement,
): string | undefined {
  if (
    'injectedByElementId' in element &&
    typeof element.injectedByElementId === 'string'
  ) {
    return element.injectedByElementId
  }
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
        checkHasEditableFormElement(element.elements, editableFormElementIds)),
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
