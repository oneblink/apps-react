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
  hasReadOnlyAncestor: boolean,
): FormTypes.FormElementWithName[] {
  return formElements.reduce<FormTypes.FormElementWithName[]>(
    (memo, formElement) => {
      const isReadOnly =
        hasReadOnlyAncestor ||
        ('readOnly' in formElement && formElement.readOnly === true)

      switch (formElement.type) {
        case 'captcha': {
          // The renderer omits a captcha inside a read-only container, so
          // requiring one here would fail validation with an error the user
          // cannot see or resolve.
          if (isReadOnly) {
            return memo
          }
          return [...memo, formElement]
        }
        case 'page':
        case 'section': {
          return [
            ...memo,
            ...stripFormElementsWithoutName(formElement.elements, isReadOnly),
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
                isReadOnly,
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
  const formElementsWithName = React.useMemo(() => {
    return stripFormElementsWithoutName(pages, false)
  }, [pages])

  const handleValidate = React.useCallback(
    (
      submission: SubmissionTypes.S3SubmissionData['submission'],
      formElementsConditionallyShown: FormElementsConditionallyShown,
      executedLookups: ExecutedLookups,
      captchaType: CaptchaType,
      isOffline: boolean,
      audience: FormTypes.FormElementHiddenFromAudience,
    ) => {
      return validateSubmission({
        elements: formElementsWithName,
        submission,
        formElementsConditionallyShown,
        executedLookups,
        captchaType,
        isOffline,
        audience,
      })
    },
    [formElementsWithName],
  )

  return {
    validate: handleValidate,
  }
}
