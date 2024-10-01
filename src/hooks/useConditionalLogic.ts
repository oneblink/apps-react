import { Sentry } from '@oneblink/apps'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import * as React from 'react'
import { conditionalLogicService } from '@oneblink/sdk-core'

import { FormElementsConditionallyShown } from '../types/form'

export default function useConditionalLogic(
  definition: FormTypes.Form,
  submission: SubmissionTypes.S3SubmissionData['submission'],
) {
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
        formElements: definition.elements,
        submission,
        errorCallback,
      })
    }, [definition.elements, submission, errorCallback])

  const submissionConditionallyEnabled = React.useMemo(() => {
    if (!definition.enableSubmission) {
      return true
    }
    const { requiresAllConditionalPredicates, conditionalPredicates } =
      definition.enableSubmission
    return conditionalLogicService.evaluateConditionalPredicates({
      isConditional: true,
      requiresAllConditionalPredicates,
      conditionalPredicates,
      formElements: definition.elements,
      submission,
    })
  }, [definition.elements, definition.enableSubmission, submission])

  return {
    conditionalLogicError,
    formElementsConditionallyShown,
    submissionConditionallyEnabled,
  }
}
