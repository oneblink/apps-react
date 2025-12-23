import * as React from 'react'
import getDateRangeConfiguration from '../services/getDateRangeConfiguration'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import { FormTypes } from '@oneblink/types'

export default function useFormElementDateFromTo(
  element: FormTypes.FormElementWithDate,
) {
  const { formSubmissionModel, elements } = useFormSubmissionModel()

  const [fromDate, fromDaysOffset] = React.useMemo(() => {
    return getDateRangeConfiguration(
      {
        referenceFormElementId: element.fromDateElementId,
        date: element.fromDate,
        daysOffset: element.fromDateDaysOffset,
      },
      elements,
      formSubmissionModel,
    )
  }, [
    // prettier-ignore
    element.fromDate,
    element.fromDateDaysOffset,
    element.fromDateElementId,
    elements,
    formSubmissionModel,
  ])

  const [toDate, toDaysOffset] = React.useMemo(() => {
    return getDateRangeConfiguration(
      {
        referenceFormElementId: element.toDateElementId,
        date: element.toDate,
        daysOffset: element.toDateDaysOffset,
      },
      elements,
      formSubmissionModel,
    )
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
