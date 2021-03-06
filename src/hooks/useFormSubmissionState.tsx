import * as React from 'react'
import _cloneDeep from 'lodash.clonedeep'
import { FormTypes } from '@oneblink/types'
import generateDefaultData from '../services/generate-default-data'
import { FormSubmissionModel } from '../types/form'

export default function useFormSubmissionState(
  form: FormTypes.Form,
  initialSubmission?: FormSubmissionModel,
) {
  return React.useState(() => {
    const definition = _cloneDeep(form)
    const defaultData = generateDefaultData(
      definition.elements,
      initialSubmission || {},
    )
    return {
      definition,
      submission: defaultData,
    }
  })
}
