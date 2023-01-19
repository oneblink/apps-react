import { formElementsService } from '@oneblink/sdk-core'
import { FormTypes } from '@oneblink/types'

const infoPageElements: FormTypes.FormElementType[] = [
  'heading',
  'html',
  'image',
  'section',
]
export default function determineIsInfoPage(form: FormTypes.Form) {
  formElementsService.forEachFormElement(form.elements, (e) => {
    if (!infoPageElements.includes(e.type)) return false
  })
  return true
}
