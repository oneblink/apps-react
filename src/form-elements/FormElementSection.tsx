import * as React from 'react'
import clsx from 'clsx'
import { Collapse, Tooltip } from '@material-ui/core'
import { FormTypes } from '@oneblink/types'
import useBooleanState from '../hooks/useBooleanState'
import FormElementForm, { Props } from './FormElementForm'

function FormElementSection(
  props: Omit<Props, 'element'> & {
    element: FormTypes.SectionElement
  },
) {
  const [isCollapsed, , , toggle] = useBooleanState(props.element.isCollapsed)
  const isValid =
    !props.formElementValidation || !props.displayValidationMessage
  return (
    <div className="ob-section">
      <div
        className="ob-section__header cypress-section-header"
        onClick={toggle}
      >
        <h3 className="ob-section__header-text title is-3">
          {props.element.label}
          {props.element.hint && (
            <Tooltip
              title={props.element.hint}
              arrow
              enterTouchDelay={0}
              leaveTouchDelay={10000}
            >
              <i className="material-icons has-text-grey-light ob-label__hint">
                info
              </i>
            </Tooltip>
          )}
        </h3>
        <div className="ob-section__header-icon-container">
          {!isValid && (
            <i className="material-icons cypress-section-invalid-valid has-text-danger">
              {'warning'}
            </i>
          )}
          <i
            className={clsx('ob-section__header-icon material-icons', {
              'is-rotated': isCollapsed,
            })}
          >
            expand_more
          </i>
        </div>
      </div>
      <hr className="ob-section__divider" />
      <Collapse
        in={!!isCollapsed}
        classes={{ container: 'ob-section__content' }}
        unmountOnExit
      >
        <FormElementForm {...props} />
      </Collapse>
    </div>
  )
}

export default React.memo(FormElementSection)
