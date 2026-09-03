import { FormTypes } from '@oneblink/types'
import useEditableFormElementIds from './useEditableFormElementIds'
import useFormIsReadOnly from './useFormIsReadOnly'
import { checkAreLookupsDisallowed } from '../utils/read-only-form-elements'

export default function useAreLookupsDisallowed(
  element: FormTypes.FormElement | FormTypes.LookupFormElement,
): boolean {
  const isFormReadOnly = useFormIsReadOnly()
  const editableFormElementIds = useEditableFormElementIds()

  return checkAreLookupsDisallowed(element, {
    isFormReadOnly,
    editableFormElementIds,
  })
}
