import { FormTypes, SubmissionTypes } from '@oneblink/types'
import * as React from 'react'

import {
  validateSubmission,
  generateValidationSchema,
} from '../services/form-validation'
import { FormElementsConditionallyShown } from '../types/form'

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
  const removeExecutedLookup = React.useCallback(
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

  const formElementsWithoutName = React.useMemo(() => {
    return stripFormElementsWithoutName(pages)
  }, [pages])

  const validationSchema = React.useMemo(() => {
    return generateValidationSchema(
      formElementsWithoutName,
      elementIdsWithLookupsExecuted,
    )
  }, [formElementsWithoutName, elementIdsWithLookupsExecuted])

  const handleValidate = React.useCallback(
    (
      submission: SubmissionTypes.S3SubmissionData['submission'],
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
    removeExecutedLookup,
    validate: handleValidate,
  }
}
