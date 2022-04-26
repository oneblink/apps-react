import * as React from 'react'

const submissionIdInvalidMessage = 'Must be a valid Submission Id'

export const UUIDValidatorFn = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return true
  }

  if (typeof value !== 'string') {
    return false
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

export const validateIsUUID = (value: unknown) =>
  !!value || !UUIDValidatorFn(value)

const useSubmissionIdValidationMessage = (submissionId: string | undefined) => {
  return React.useMemo(() => {
    if (!validateIsUUID(submissionId)) {
      return submissionIdInvalidMessage
    }
  }, [submissionId])
}

export default useSubmissionIdValidationMessage
