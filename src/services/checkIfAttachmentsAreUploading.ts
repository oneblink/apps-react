import { FormTypes } from '@oneblink/types'
import { Attachment } from '../types/attachments'
import { Value as FormElementComplianceValue } from '../form-elements/FormElementCompliance'

function checkIfAttachmentsAreUploadingForFormElements(
  formElements: FormTypes.FormElement[],
  submission: FormElementsCtrl['model'],
): boolean {
  return formElements.some((formElement) => {
    switch (formElement.type) {
      case 'page': {
        return checkIfAttachmentsAreUploadingForFormElements(
          formElement.elements,
          submission,
        )
      }
      case 'form': {
        const nestedSubmission = submission[formElement.name]
        if (!nestedSubmission || typeof nestedSubmission !== 'object') {
          break
        }
        return checkIfAttachmentsAreUploadingForFormElements(
          formElement.elements || [],
          nestedSubmission as FormElementsCtrl['model'],
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
            checkIfAttachmentsAreUploadingForFormElements(
              formElement.elements,
              entry,
            )
          )
        })
      }
      case 'camera':
      case 'draw':
      case 'compliance':
      case 'files': {
        if (!formElement.storageType || formElement.storageType === 'legacy') {
          break
        }

        const value = submission[formElement.name]
        if (!value) {
          break
        }

        // If the attachment has a type, it has not finished uploading
        switch (formElement.type) {
          case 'camera':
          case 'draw': {
            return !!(value as Attachment)?.type
          }
          case 'compliance': {
            return (value as FormElementComplianceValue).files?.some((file) => {
              return !!(file as Attachment)?.type
            })
          }
          case 'files': {
            return (value as Attachment[])?.some((attachment) => {
              return !!attachment?.type
            })
          }
        }
      }
    }
  })
}

export default function checkIfAttachmentsAreUploading(
  form: FormTypes.Form,
  submission: FormElementsCtrl['model'],
): boolean {
  return checkIfAttachmentsAreUploadingForFormElements(
    form.elements,
    submission,
  )
}
