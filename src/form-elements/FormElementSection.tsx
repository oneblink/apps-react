import * as React from 'react'
import clsx from 'clsx'
import { Collapse } from '@material-ui/core'
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
        <div className="ob-section__header-icon-container">
          <i
            className={clsx('ob-section__header-icon material-icons', {
              'cypress-section-valid-icon has-text-grey-light': isValid,
              'cypress-section-invalid-valid has-text-danger': !isValid,
            })}
          >
            {isValid ? 'check_circle' : 'warning'}
          </i>
        </div>
        <h3 className="ob-section__header-text title is-3">
          {props.element.label}
        </h3>
        <div className="ob-section__header-icon-container">
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
