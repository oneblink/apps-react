import * as React from 'react'
import ReactTooltip from 'react-tooltip'
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
        {element.hint && (
          <i
            data-tip={!!element.hint}
            data-for={`${id}-hint`}
            className="material-icons has-text-grey-light ob-label__hint"
          >
            info
          </i>
        )}
      </label>
      {element.hint && (
        <ReactTooltip id={`${id}-hint`} effect="solid" place="right">
          {element.hint}
        </ReactTooltip>
      )}
      {children}
    </div>
  )
}

export default React.memo(FormElementLabelContainer)
