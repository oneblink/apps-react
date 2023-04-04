import * as React from 'react'
import { submissionService } from '@oneblink/sdk-core'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import { FormTypes } from '@oneblink/types'

export default function useFormElementDateFromTo(
  element: FormTypes.FormElementWithDate,
) {
  const { formSubmissionModel, elements } = useFormSubmissionModel()

  const fromDate = React.useMemo(() => {
    if (element.fromDateElementId) {
      const fromDateValue = submissionService.getRootElementValueById(
        element.fromDateElementId,
        elements,
        formSubmissionModel,
      )
      if (fromDateValue) {
        return fromDateValue
      }
    }
    return element.fromDate
  }, [
    element.fromDate,
    element.fromDateElementId,
    elements,
    formSubmissionModel,
  ])

  const toDate = React.useMemo(() => {
    if (element.toDateElementId) {
      const toDateValue = submissionService.getRootElementValueById(
        element.toDateElementId,
        elements,
        formSubmissionModel,
      )
      if (toDateValue) {
        return toDateValue
      }
    }
    return element.toDate
  }, [element.toDate, element.toDateElementId, elements, formSubmissionModel])

  return {
    fromDate,
    toDate,
  }
}
