import * as React from 'react'
import ReactTooltip from 'react-tooltip'
import clsx from 'clsx'
import { FormTypes } from '@oneblink/types'

function FormElementLabelContainer({
  className,
  element,
  id,
  required,
  children,
}: {
  className: string
  element: FormTypes.FormElementBase
  id: string
  required: boolean
  children: React.ReactNode
}) {
  return (
    <div className={clsx('ob-form__element', className)}>
      <div className="label ob-label__container">
        <label
          className={clsx('ob-label', {
            'ob-label__required is-required': required,
          })}
          htmlFor={id}
        >
          {element.label}
        </label>
        {element.hint && (
          <>
            <i
              data-tip={!!element.hint}
              data-for={`${id}-hint`}
              className="material-icons has-text-grey-light ob-label__hint"
              data-effect="solid"
              data-place="right"
              data-delay-hide={100}
            >
              info
            </i>
            <ReactTooltip id={`${id}-hint`} clickable>
              {element.hint}
            </ReactTooltip>
          </>
        )}
      </div>
      {children}
    </div>
  )
}

export default React.memo(FormElementLabelContainer)
