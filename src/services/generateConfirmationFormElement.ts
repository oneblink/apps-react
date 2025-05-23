import { FormTypes } from '@oneblink/types'

export default function generateConfirmationFormElementName(
  formElement: FormTypes.EmailElement,
) {
  return window.btoa(formElement.name)
}
