import * as React from 'react'

export default function useValidationClass({
  formElementsValid,
  displayValidationMessage,
  validClassName,
  invalidClassName,
}: {
  formElementsValid: boolean
  displayValidationMessage: boolean
  validClassName: string
  invalidClassName: string
}): {
  validationClassName: string
  valid: boolean
} {
  return React.useMemo(() => {
    if (!formElementsValid) {
      return { validationClassName: validClassName, valid: true }
    }
    if (displayValidationMessage) {
      return { validationClassName: invalidClassName, valid: false }
    }
    return { validationClassName: '', valid: false }
  }, [
    formElementsValid,
    displayValidationMessage,
    validClassName,
    invalidClassName,
  ])
}
