import * as React from 'react'
import { ValidatorForm } from 'react-material-ui-form-validator'

const submissionIdInvalidMessage = 'Must be a valid Submission Id'

const useSubmissionIdValidationMessage = (submissionId: string | undefined) => {
  return React.useMemo(() => {
    if (!ValidatorForm.getValidator('isUUID', submissionId, true)) {
      return submissionIdInvalidMessage
    }
  }, [submissionId])
}

export default useSubmissionIdValidationMessage
