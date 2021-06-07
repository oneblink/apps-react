import * as React from 'react'
import { Tooltip } from '@material-ui/core'
import clsx from 'clsx'
import { FormTypes } from '@oneblink/types'

function FormElementLabelContainer({
  className,
  element,
  id,
  required,
  children,
  childrenFirst,
}: {
  className: string
  element: FormTypes.FormElementBase
  id: string
  required: boolean
  children: React.ReactNode
  childrenFirst?: boolean
}) {
  return (
    <div className={clsx('ob-form__element', className)}>
      <div className="label ob-label__container">
        {childrenFirst && children}
        <label
          className={clsx('ob-label', {
            'ob-label__required is-required': required,
          })}
          htmlFor={id}
        >
          {element.label}
        </label>
        {element.hint && (
          <Tooltip
            title={element.hint}
            arrow
            enterTouchDelay={0}
            leaveTouchDelay={10000}
          >
            <i className="material-icons has-text-grey-light ob-label__hint">
              info
            </i>
          </Tooltip>
        )}
      </div>
      {!childrenFirst && children}
    </div>
  )
}

export default React.memo(FormElementLabelContainer)
