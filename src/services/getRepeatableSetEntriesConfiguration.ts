import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { RepeatableSetElement } from '@oneblink/types/typescript/forms'
import { submissionService } from '@oneblink/sdk-core'

export default function getRepeatableSetEntriesConfiguration(
  setEntries: RepeatableSetElement['minSetEntries'],
  elements: FormTypes.FormElement[],
  formSubmissionModel: SubmissionTypes.S3SubmissionData['submission'],
) {
  if (setEntries && typeof setEntries === 'object') {
    const value = submissionService.getRootElementValueById(
      setEntries.elementId,
      elements,
      formSubmissionModel,
    )
    if (value) {
      return value as number
    }
  }
  if (typeof setEntries === 'number') {
    return setEntries
  }
  return undefined
}
