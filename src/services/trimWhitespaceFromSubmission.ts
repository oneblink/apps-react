import { FormTypes } from '@oneblink/types'
import { FormSubmissionModel } from '../types/form'

export default function trimWhitespaceFromSubmission(
  elements: FormTypes.FormElement[],
  submission: FormSubmissionModel,
): FormSubmissionModel | void {
  const result: FormSubmissionModel = {
    ...submission,
  }
  for (const formElement of elements) {
    switch (formElement.type) {
      case 'section':
      case 'page': {
        const newTrimmedSubmission = trimWhitespaceFromSubmission(
          formElement.elements,
          result,
        )
        if (newTrimmedSubmission) {
          Object.assign(result, newTrimmedSubmission)
        }
        break
      }
      case 'form': {
        const nestedSubmission = submission[formElement.name]
        if (!nestedSubmission || typeof nestedSubmission !== 'object') {
          break
        }
        const newTrimmedSubmission = trimWhitespaceFromSubmission(
          formElement.elements || [],
          result,
        )
        if (newTrimmedSubmission) {
          result[formElement.name] = newTrimmedSubmission
        }
        break
      }
      case 'repeatableSet': {
        const entries = submission[formElement.name]
        if (!Array.isArray(entries)) {
          break
        }
        const newEntries = [...entries]
        for (let index = 0; index < entries.length; index++) {
          const entry = entries[index]
          if (typeof entry === 'object') {
            const newEntry = trimWhitespaceFromSubmission(
              formElement.elements,
              entry,
            )
            if (newEntry) {
              newEntries[index] = newEntry
            }
          }
        }
        result[formElement.name] = newEntries
        break
      }
      case 'number':
      case 'text':
      case 'textarea':
      case 'email':
      case 'barcodeScanner':
      case 'telephone': {
        const value = result[formElement.name] as string
        result[formElement.name] = value.trim()
        break
      }
    }
  }
}
