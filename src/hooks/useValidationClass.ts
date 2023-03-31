import * as React from 'react'

export default function useValidationClass({
  formElementsValid,
  displayInvalidClassName,
  validClassName,
  invalidClassName,
}: {
  formElementsValid: boolean
  displayInvalidClassName: boolean
  validClassName: string
  invalidClassName: string
}): {
  validationClassName: string
  valid: boolean
} {
  return React.useMemo(() => {
    if (formElementsValid) {
      return { validationClassName: validClassName, valid: true }
    }
    if (displayInvalidClassName) {
      return { validationClassName: invalidClassName, valid: false }
    }
    return { validationClassName: '', valid: false }
  }, [
    formElementsValid,
    displayInvalidClassName,
    validClassName,
    invalidClassName,
  ])
}
