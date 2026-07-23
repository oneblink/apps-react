import { Sentry } from '../apps'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import * as React from 'react'
import { conditionalLogicService } from '@oneblink/sdk-core'

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

  const { formElementsConditionallyShown, submissionConditionallyEnabled } =
    React.useMemo(() => {
      const { formElementsConditionallyShown, isSubmissionEnabled } =
        conditionalLogicService.generateFormElementsConditionallyShown({
          formElements,
          submission,
          enableSubmission,
          errorCallback,
        })

      return {
        formElementsConditionallyShown,
        submissionConditionallyEnabled: isSubmissionEnabled,
      }
    }, [formElements, submission, enableSubmission, errorCallback])

  return {
    conditionalLogicError,
    formElementsConditionallyShown,
    submissionConditionallyEnabled,
  }
}
