import { FormTypes, SubmissionTypes } from '@oneblink/types'
import * as React from 'react'

import {
  validateSubmission,
  generateValidationSchema,
} from '../services/form-validation'
import { ExecutedLookups, FormElementsConditionallyShown } from '../types/form'

function stripFormElementsWithoutName(
  formElements: FormTypes.FormElement[],
): FormTypes.FormElementWithName[] {
  return formElements.reduce<FormTypes.FormElementWithName[]>(
    (memo, formElement) => {
      switch (formElement.type) {
        case 'page':
        case 'section': {
          return [
            ...memo,
            ...stripFormElementsWithoutName(formElement.elements),
          ]
        }
        case 'infoPage':
        case 'form':
        case 'repeatableSet': {
          return [
            ...memo,
            {
              ...formElement,
              elements: stripFormElementsWithoutName(
                formElement.elements || [],
              ),
            },
          ]
        }
        default: {
          return [...memo, formElement]
        }
      }
    },
    [],
  )
}

export default function useFormValidation(pages: FormTypes.PageElement[]) {
  const formElementsWithoutName = React.useMemo(() => {
    return stripFormElementsWithoutName(pages)
  }, [pages])

  const validationSchema = React.useMemo(() => {
    return generateValidationSchema(formElementsWithoutName)
  }, [formElementsWithoutName])

  const handleValidate = React.useCallback(
    (
      submission: SubmissionTypes.S3SubmissionData['submission'],
      formElementsConditionallyShown: FormElementsConditionallyShown,
      executedLookups: ExecutedLookups,
    ) => {
      return validateSubmission(
        validationSchema,
        submission,
        formElementsConditionallyShown,
        executedLookups,
      )
    },
    [validationSchema],
  )

  return {
    validate: handleValidate,
  }
}
