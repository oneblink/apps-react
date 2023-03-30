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
      return submissionService.getRootElementValueById(
        element.fromDateElementId,
        elements,
        formSubmissionModel,
      )
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
      return submissionService.getRootElementValueById(
        element.toDateElementId,
        elements,
        formSubmissionModel,
      )
    }
    return element.toDate
  }, [element.toDate, element.toDateElementId, elements, formSubmissionModel])

  return {
    fromDate,
    toDate,
  }
}
