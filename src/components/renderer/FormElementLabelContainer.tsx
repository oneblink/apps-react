import * as React from 'react'
import { Tooltip } from '@mui/material'
import clsx from 'clsx'
import { FormTypes } from '@oneblink/types'
import useReplaceableText from '../../hooks/useReplaceableText'
import QuillHTML from '../QuillHTML'
//import MaterialIcon from '../MaterialIcon'

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
            <HintTooltip hint={element.hint} inputId={id} />
          )}
      </div>
      {element.hint && element.hintPosition === 'BELOW_LABEL' && (
        <div className="ob-hint-text__container">
          <HintBelowLabel hint={element.hint} inputId={id} />
        </div>
      )}
      {children}
    </div>
  )
}

export function HintTooltip({
  hint,
  inputId,
}: {
  hint: string
  inputId: string
}) {
  const html = useReplaceableText(hint)

  return (
    <Tooltip
      title={<QuillHTML html={html} className="ob-hint-tooltip" />}
      arrow
      enterTouchDelay={0}
      leaveTouchDelay={10000}
      id={`${inputId}-hint`}
    >
      <i className="material-icons has-text-grey ob-label__hint">info</i>
    </Tooltip>
  )
}

export function HintBelowLabel({
  hint,
  inputId,
}: {
  hint: string
  inputId: string
}) {
  const html = useReplaceableText(hint)

  return (
    <QuillHTML html={html} className="ob-hint-text" id={`${inputId}-hint`} />
  )
}

export default React.memo(FormElementLabelContainer)
