import { FormTypes } from '@oneblink/types'
import { FormSubmissionModel } from '../types/form'

function checkIfBsbsAreValidatingForFormElements(
  formElements: FormTypes.FormElement[],
  submission: FormSubmissionModel,
): boolean {
  return formElements.some((formElement) => {
    switch (formElement.type) {
      case 'section':
      case 'page': {
        return checkIfBsbsAreValidatingForFormElements(
          formElement.elements,
          submission,
        )
      }
      case 'form': {
        const nestedSubmission = submission[formElement.name]
        if (!nestedSubmission || typeof nestedSubmission !== 'object') {
          break
        }
        return checkIfBsbsAreValidatingForFormElements(
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
            checkIfBsbsAreValidatingForFormElements(formElement.elements, entry)
          )
        })
      }
      case 'bsb': {
        const value = submission[formElement.name]
        if (!value) {
          break
        }
        const bsbValue = value as string | { isValidating: boolean }
        if (typeof bsbValue === 'object') {
          return bsbValue.isValidating
        }
      }
    }
  })
}

export default function checkIfBsbsAreValidating(
  form: FormTypes.Form,
  submission: FormSubmissionModel,
): boolean {
  return checkIfBsbsAreValidatingForFormElements(form.elements, submission)
}
