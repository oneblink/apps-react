import { FormTypes } from '@oneblink/types'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import React from 'react'
import getRepeatableSetEntriesConfiguration from '../services/getRepeatableSetEntriesConfiguration'

export default function useFormElementRepeatableSetEntries(
  element: FormTypes.RepeatableSetElement,
) {
  const { formSubmissionModel, elements } = useFormSubmissionModel()

  const minSetEntries = React.useMemo(() => {
    return getRepeatableSetEntriesConfiguration(
      element.minSetEntries,
      elements,
      formSubmissionModel,
    )
  }, [element.minSetEntries, elements, formSubmissionModel])

  const maxSetEntries = React.useMemo(() => {
    return getRepeatableSetEntriesConfiguration(
      element.maxSetEntries,
      elements,
      formSubmissionModel,
    )
  }, [element.maxSetEntries, elements, formSubmissionModel])

  return {
    minSetEntries,
    maxSetEntries,
  }
}
