import * as React from 'react'
import clsx from 'clsx'
import useValidationIconConfiguration from '../../hooks/useValidationIconConfiguration'
import MaterialIcon from '../MaterialIcon'

export const ValidationIcon = React.memo(function ValidationIcon() {
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
})

export default React.memo(function FormElementValidationMessage({
  message,
  className,
}: {
  message?: string
  className?: string
}) {
  if (!message) {
    return null
  }

  return (
    <div role="alert" className="has-margin-top-8">
      <div
        className={clsx(
          'has-text-danger ob-error__text cypress-validation-message',
          className,
        )}
      >
        <ValidationIcon />
        <span>{message}</span>
      </div>
    </div>
  )
})
