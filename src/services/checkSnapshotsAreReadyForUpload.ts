import { FormTypes, SubmissionTypes } from '@oneblink/types'

function checkIfSnapshotsAreStillBeingGenerated(
  formElements: FormTypes.FormElement[],
  submission: SubmissionTypes.S3SubmissionData['submission'],
): boolean {
  return formElements.some((formElement) => {
    switch (formElement.type) {
      case 'section':
      case 'page': {
        return checkIfSnapshotsAreStillBeingGenerated(
          formElement.elements,
          submission,
        )
      }
      case 'form': {
        const nestedSubmission = submission[formElement.name]
        if (!nestedSubmission || typeof nestedSubmission !== 'object') {
          break
        }
        return checkIfSnapshotsAreStillBeingGenerated(
          formElement.elements || [],
          nestedSubmission as SubmissionTypes.S3SubmissionData['submission'],
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
            checkIfSnapshotsAreStillBeingGenerated(formElement.elements, entry)
          )
        })
      }
      case 'arcGISWebMap': {
        const value = submission[formElement.name]
        // @ts-expect-error - POC
        if (!value?.snapshot) {
          break
        }
        if (value.snapshot.data.size === 0) {
          return false
        }
        break
      }
    }
  })
}

export default function checkSnapshotsAreReadyForUpload(
  form: FormTypes.Form,
  submission: SubmissionTypes.S3SubmissionData['submission'],
): boolean {
  return !checkIfSnapshotsAreStillBeingGenerated(form.elements, submission)
}
