import { FormTypes, SubmissionTypes } from '@oneblink/types'
import * as React from 'react'

import validateSubmission from '../services/form-validation/validateSubmission'
import getApproverEditableFormElementIds from '../services/form-validation/getApproverEditableFormElementIds'
import getFormElementsValidatedForAudience from '../services/form-validation/getFormElementsValidatedForAudience'
import {
  CaptchaType,
  ExecutedLookups,
  FormElementsConditionallyShown,
} from '../types/form'

export default function useFormValidation(
  pages: FormTypes.PageElement[],
  approvalSteps: FormTypes.Form['approvalSteps'],
) {
  const approverEditableFormElementIds = React.useMemo(
    () => getApproverEditableFormElementIds(approvalSteps),
    [approvalSteps],
  )

  const handleValidate = React.useCallback(
    (
      submission: SubmissionTypes.S3SubmissionData['submission'],
      formElementsConditionallyShown: FormElementsConditionallyShown,
      executedLookups: ExecutedLookups,
      captchaType: CaptchaType,
      isOffline: boolean,
      audience: FormTypes.FormElementHiddenFromAudience,
      editableFormElementIds: string[] | undefined,
    ) => {
      return validateSubmission({
        elements: getFormElementsValidatedForAudience(pages, audience),
        submission,
        formElementsConditionallyShown,
        executedLookups,
        captchaType,
        isOffline,
        audience,
        editableFormElementIds,
        approverEditableFormElementIds,
      })
    },
    [approverEditableFormElementIds, pages],
  )

  return {
    validate: handleValidate,
  }
}
