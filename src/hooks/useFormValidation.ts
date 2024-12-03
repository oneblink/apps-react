import { FormTypes, SubmissionTypes } from '@oneblink/types'
import * as React from 'react'

import validateSubmission from '../services/form-validation/validateSubmission'
import {
  CaptchaType,
  ExecutedLookups,
  FormElementsConditionallyShown,
} from '../types/form'

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

  const handleValidate = React.useCallback(
    (
      submission: SubmissionTypes.S3SubmissionData['submission'],
      formElementsConditionallyShown: FormElementsConditionallyShown,
      executedLookups: ExecutedLookups,
      captchaType: CaptchaType,
      isOffline: boolean,
    ) => {
      return validateSubmission({
        elements: formElementsWithoutName,
        submission,
        formElementsConditionallyShown,
        executedLookups,
        captchaType,
        isOffline,
      })
    },
    [formElementsWithoutName],
  )

  return {
    validate: handleValidate,
  }
}
