import * as React from 'react'
import { Tooltip } from '@mui/material'
import clsx from 'clsx'
import { FormTypes } from '@oneblink/types'
import useHint from '../../hooks/useHint'
import QuillHTML from '../QuillHTML'

function FormElementLabelContainer({
  className,
  element,
  id,
  required,
  children,
  leading,
}: {
  className: string
  element: FormTypes.FormElementBase
  id: string
  required: boolean
  children: React.ReactNode
  leading?: React.ReactNode
}) {
  return (
    <div className={clsx('ob-form__element', className)}>
      <div className="label ob-label__container">
        {leading}
        <label
          className={clsx('ob-label', {
            'ob-label__required is-required': required,
          })}
          htmlFor={id}
        >
          {element.label}
        </label>
        {element.hint &&
          (element.hintPosition === 'TOOLTIP' || !element.hintPosition) && (
            <HintTooltip hint={element.hint} />
          )}
      </div>
      {element.hint && element.hintPosition === 'BELOW_LABEL' && (
        <div className="ob-hint-text__container">
          <HintBelowLabel hint={element.hint} />
        </div>
      )}
      {children}
    </div>
  )
}

export function HintTooltip({ hint }: { hint: string }) {
  const html = useHint(hint)

  return (
    <Tooltip
      title={<QuillHTML html={html} className="ob-hint-tooltip" />}
      arrow
      enterTouchDelay={0}
      leaveTouchDelay={10000}
    >
      <i className="material-icons has-text-grey-light ob-label__hint">info</i>
    </Tooltip>
  )
}

export function HintBelowLabel({ hint }: { hint: string }) {
  const html = useHint(hint)

  return <QuillHTML html={html} className="ob-hint-text" />
}

export default React.memo(FormElementLabelContainer)
