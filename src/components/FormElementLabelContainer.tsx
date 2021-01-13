import * as React from 'react'
import clsx from 'clsx'
import { FormTypes } from '@oneblink/types'

function FormElementLabelContainer({
  className,
  element,
  id,
  children,
}: {
  className: string
  element: FormTypes.FormElementRequired
  id: string
  children: React.ReactNode
}) {
  return (
    <div className={clsx('ob-form__element', className)}>
      <label
        className={clsx('label ob-label', {
          'is-required': element.required,
        })}
        htmlFor={id}
      >
        {element.label}
      </label>
      {children}
    </div>
  )
}

export default React.memo(FormElementLabelContainer)
