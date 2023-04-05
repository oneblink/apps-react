import * as React from 'react'
import { submissionService } from '@oneblink/sdk-core'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import { FormTypes } from '@oneblink/types'

export default function useFormElementDateFromTo(
  element: FormTypes.FormElementWithDate,
) {
  const { formSubmissionModel, elements } = useFormSubmissionModel()

  const { fromDate, fromDaysOffset } = React.useMemo(() => {
    if (element.fromDateElementId) {
      const fromDateValue = submissionService.getRootElementValueById(
        element.fromDateElementId,
        elements,
        formSubmissionModel,
      )
      if (fromDateValue) {
        return {
          fromDate: fromDateValue,
          fromDaysOffset: element.fromDateDaysOffset,
        }
      }
    }
    return {
      fromDate: element.fromDate,
      fromDaysOffset:
        element.fromDate === 'NOW' ? element.fromDateDaysOffset : undefined,
    }
  }, [element, elements, formSubmissionModel])

  const { toDate, toDaysOffset } = React.useMemo(() => {
    if (element.toDateElementId) {
      const toDateValue = submissionService.getRootElementValueById(
        element.toDateElementId,
        elements,
        formSubmissionModel,
      )
      if (toDateValue) {
        return { toDate: toDateValue, toDaysOffset: element.toDateDaysOffset }
      }
    }
    return {
      toDate: element.toDate,
      toDaysOffset:
        element.toDate === 'NOW' ? element.toDateDaysOffset : undefined,
    }
  }, [
    element.toDate,
    element.toDateDaysOffset,
    element.toDateElementId,
    elements,
    formSubmissionModel,
  ])

  return {
    fromDate,
    fromDaysOffset,
    toDate,
    toDaysOffset,
  }
}
