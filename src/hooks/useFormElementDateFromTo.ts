import * as React from 'react'
import { submissionService } from '@oneblink/sdk-core'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import { FormTypes } from '@oneblink/types'

export default function useFormElementDateFromTo(
  element: FormTypes.FormElementWithDate,
) {
  const { formSubmissionModel, elements } = useFormSubmissionModel()

  const [fromDateElementIdUsed, setFromDateElementIdUsed] =
    React.useState(false)

  const [toDateElementIdUsed, setToDateElementIdUsed] = React.useState(false)

  const fromDate = React.useMemo(() => {
    if (element.fromDateElementId) {
      const fromDateValue = submissionService.getRootElementValueById(
        element.fromDateElementId,
        elements,
        formSubmissionModel,
      )
      if (fromDateValue) {
        setFromDateElementIdUsed(true)
        return fromDateValue
      }
    }
    setFromDateElementIdUsed(false)
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
        setToDateElementIdUsed(true)
        return toDateValue
      }
    }
    setToDateElementIdUsed(false)
    return element.toDate
  }, [element.toDate, element.toDateElementId, elements, formSubmissionModel])

  return {
    fromDate,
    toDate,
    fromDateElementIdUsed,
    toDateElementIdUsed,
  }
}
