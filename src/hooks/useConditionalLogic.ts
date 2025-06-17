import { Sentry } from '@oneblink/apps'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import * as React from 'react'
import { conditionalLogicService } from '@oneblink/sdk-core'

import { FormElementsConditionallyShown } from '../types/form'
import cleanFormSubmissionModel from '../services/cleanFormSubmissionModel'

export default function useConditionalLogic({
  formElements,
  submission,
  enableSubmission,
}: {
  formElements: FormTypes.FormElement[]
  submission: SubmissionTypes.S3SubmissionData['submission']
  enableSubmission: FormTypes.Form['enableSubmission']
}) {
  const [conditionalLogicError, setConditionalLogicError] = React.useState<
    Error | undefined
  >()

  const errorCallback = React.useCallback((error: Error) => {
    console.warn('Error while checking conditional logic', error)
    Sentry.captureException(error)
    setConditionalLogicError(error)
  }, [])

  const formElementsConditionallyShown =
    React.useMemo<FormElementsConditionallyShown>(() => {
      return conditionalLogicService.generateFormElementsConditionallyShown({
        formElements,
        submission,
        errorCallback,
      })
    }, [formElements, submission, errorCallback])

  const submissionConditionallyEnabled = React.useMemo(() => {
    if (!enableSubmission) {
      return true
    }
    const { requiresAllConditionalPredicates, conditionalPredicates } =
      enableSubmission
    const { model } = cleanFormSubmissionModel(
      submission,
      formElements,
      formElementsConditionallyShown,
      true,
    )
    return conditionalLogicService.evaluateConditionalPredicates({
      isConditional: true,
      requiresAllConditionalPredicates,
      conditionalPredicates,
      formElements,
      submission: model,
    })
  }, [
    formElements,
    enableSubmission,
    formElementsConditionallyShown,
    submission,
  ])

  return {
    conditionalLogicError,
    formElementsConditionallyShown,
    submissionConditionallyEnabled,
  }
}
