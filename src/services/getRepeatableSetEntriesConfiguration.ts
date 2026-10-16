import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { RepeatableSetElement } from '@oneblink/types/typescript/forms'
import { submissionService } from '@oneblink/sdk-core'

function coerceMappedElementValueToNumber(
  value: unknown,
): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value === 'number' && !isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (!isNaN(parsed)) {
      return parsed
    }
  }
  return undefined
}

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
    return coerceMappedElementValueToNumber(value)
  }
  if (typeof setEntries === 'number') {
    return setEntries
  }
  return undefined
}
