import { formElementsService } from '@oneblink/sdk-core'
import { FormTypes } from '@oneblink/types'

const infoPageElements: FormTypes.FormElementType[] = [
  'heading',
  'html',
  'image',
  'section',
]
export default function determineIsInfoPage(form: FormTypes.Form) {
  const foundInputElement = formElementsService.findFormElement(
    form.elements,
    (e) => {
      return !infoPageElements.includes(e.type)
    },
  )
  return !foundInputElement
}
