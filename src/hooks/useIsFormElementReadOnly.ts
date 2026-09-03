import { FormTypes } from '@oneblink/types'
import useEditableFormElementIds from './useEditableFormElementIds'
import useFormIsReadOnly from './useFormIsReadOnly'
import { checkIsFormElementReadOnly } from '../utils/read-only-form-elements'

export default function useIsFormElementReadOnly(
  element: FormTypes.FormElement | FormTypes.LookupFormElement,
  isInheritedReadOnly?: boolean,
): boolean {
  const isFormReadOnly = useFormIsReadOnly()
  const editableFormElementIds = useEditableFormElementIds()

  return checkIsFormElementReadOnly(element, {
    isFormReadOnly,
    isInheritedReadOnly,
    editableFormElementIds,
  })
}
