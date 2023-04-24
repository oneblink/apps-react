import { FormTypes } from '@oneblink/types'
import { RepeatableSetElement } from '@oneblink/types/typescript/forms'
import { FormSubmissionModel } from '../types/form'
import { submissionService } from '@oneblink/sdk-core'

export default function getRepeatableSetEntriesConfiguration(
  setEntries: RepeatableSetElement['minSetEntries'],
  elements: FormTypes.FormElement[],
  formSubmissionModel: FormSubmissionModel,
) {
  if (typeof setEntries === 'object') {
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
