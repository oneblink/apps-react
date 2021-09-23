import { FormTypes } from '@oneblink/types'
import { FormSubmissionModel } from '../types/form'

function checkIfBsbsAreInvalidForFormElements(
  formElements: FormTypes.FormElement[],
  submission: FormSubmissionModel,
): boolean {
  return formElements.some((formElement) => {
    switch (formElement.type) {
      case 'section':
      case 'page': {
        return checkIfBsbsAreInvalidForFormElements(
          formElement.elements,
          submission,
        )
      }
      case 'form': {
        const nestedSubmission = submission[formElement.name]
        if (!nestedSubmission || typeof nestedSubmission !== 'object') {
          break
        }
        return checkIfBsbsAreInvalidForFormElements(
          formElement.elements || [],
          nestedSubmission as FormSubmissionModel,
        )
      }
      case 'repeatableSet': {
        const entries = submission[formElement.name]
        if (!Array.isArray(entries)) {
          break
        }
        return entries.some((entry) => {
          return (
            typeof entry === 'object' &&
            checkIfBsbsAreInvalidForFormElements(formElement.elements, entry)
          )
        })
      }
      case 'bsb': {
        const value = submission[formElement.name]
        if (!value) {
          break
        }
        const bsbValue = value as string | { isInvalid: boolean }
        if (typeof bsbValue === 'object') {
          return bsbValue.isInvalid
        }
      }
    }
  })
}

export default function checkBsbsAreInvalid(
  form: FormTypes.Form,
  submission: FormSubmissionModel,
): boolean {
  return checkIfBsbsAreInvalidForFormElements(form.elements, submission)
}
