import { FormTypes } from '@oneblink/types'
import * as React from 'react'

import {
  validateSubmission,
  generateValidationSchema,
} from '../services/form-validation'
import {
  FormElementsConditionallyShown,
  FormSubmissionModel,
} from '../types/form'

export default function useFormValidation(pages: FormTypes.PageElement[]) {
  const [elementIdsWithLookupsExecuted, setElementIdsWithLookupsExecuted] =
    React.useState<string[]>([])

  const executedLookup = React.useCallback(
    (element: FormTypes.LookupFormElement) => {
      setElementIdsWithLookupsExecuted(
        (currentElementIdsWithLookupsExecuted: string[]) => {
          if (currentElementIdsWithLookupsExecuted.includes(element.id)) {
            return currentElementIdsWithLookupsExecuted
          }
          return [...currentElementIdsWithLookupsExecuted, element.id]
        },
      )
    },
    [],
  )
  const executeLookupFailed = React.useCallback(
    (element: FormTypes.LookupFormElement) => {
      setElementIdsWithLookupsExecuted(
        (currentElementIdsWithLookupsExecuted) => {
          return currentElementIdsWithLookupsExecuted.filter(
            (elementId) => elementId !== element.id,
          )
        },
      )
    },
    [],
  )

  const validationSchema = React.useMemo(() => {
    return generateValidationSchema(pages, elementIdsWithLookupsExecuted)
  }, [pages, elementIdsWithLookupsExecuted])

  const handleValidate = React.useCallback(
    (
      submission: FormSubmissionModel,
      formElementsConditionallyShown: FormElementsConditionallyShown,
    ) => {
      return validateSubmission(
        validationSchema,
        submission,
        formElementsConditionallyShown,
      )
    },
    [validationSchema],
  )

  return {
    executedLookup,
    executeLookupFailed,
    validate: handleValidate,
  }
}
