import { submissionService } from '@oneblink/sdk-core'
import { FormTypes } from '@oneblink/types'
import { FormSubmissionModel } from '../types/form'

export type DateRangeConfigurationOptions = {
  referenceFormElementId: string | undefined
  date: string | undefined
  daysOffset: number | undefined
}

export default function getDateRangeConfiguration(
  { referenceFormElementId, date, daysOffset }: DateRangeConfigurationOptions,
  elements: FormTypes.FormElement[],
  formSubmissionModel: FormSubmissionModel,
): [string | undefined, number | undefined] {
  if (referenceFormElementId) {
    const referenceDate = submissionService.getRootElementValueById(
      referenceFormElementId,
      elements,
      formSubmissionModel,
    )
    if (typeof referenceDate === 'string') {
      return [referenceDate, daysOffset]
    }
  }
  return [date, date === 'NOW' ? daysOffset : undefined]
}
