import * as React from 'react'
import useValidationIconConfiguration from '../../hooks/useValidationIconConfiguration'
import MaterialIcon from '../MaterialIcon'

export function ValidationIcon() {
  const validationIconConfiguration = useValidationIconConfiguration()

  if (!validationIconConfiguration) {
    return null
  }

  return (
    <MaterialIcon
      aria-label={validationIconConfiguration.accessibleLabel}
      aria-hidden={!validationIconConfiguration.accessibleLabel}
      className="mr-2 ob-error__validation-icon"
    >
      {validationIconConfiguration.icon}
    </MaterialIcon>
  )
}

export default function FormElementValidationMessage({
  children,
}: {
  children?: React.ReactNode
}) {
  if (!children) {
    return null
  }

  return (
    <div role="alert" className="has-margin-top-8">
      <div className="has-text-danger ob-error__text cypress-validation-message">
        <ValidationIcon />
        {children}
      </div>
    </div>
  )
}
