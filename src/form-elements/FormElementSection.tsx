import * as React from 'react'
import clsx from 'clsx'
import { Collapse, Tooltip } from '@material-ui/core'
import { FormTypes } from '@oneblink/types'
import useBooleanState from '../hooks/useBooleanState'
import OneBlinkFormElements, { Props } from '../components/OneBlinkFormElements'
import { checkSectionValidity } from '../services/form-validation'

function FormElementSection({
  element,
  onLookup,
  ...props
}: Omit<Props, 'elements'> & {
  element: FormTypes.SectionElement
}) {
  const [isCollapsed, , , toggle] = useBooleanState(element.isCollapsed)

  const isInvalid = React.useMemo(() => {
    return (
      !!props.displayValidationMessages &&
      checkSectionValidity(element, props.formElementsValidation)
    )
  }, [element, props.displayValidationMessages, props.formElementsValidation])

  const handleLookup = React.useCallback<FormElementLookupHandler>(
    (mergeLookupResults) => {
      onLookup((currentFormSubmission) => {
        let model = currentFormSubmission.submission
        const elements = currentFormSubmission.elements.map((formElement) => {
          if (formElement.type === 'section' && formElement.id === element.id) {
            const { elements, submission } = mergeLookupResults({
              elements: formElement.elements,
              submission: currentFormSubmission.submission,
            })
            model = submission
            return {
              ...formElement,
              elements,
            }
          }
          return formElement
        })

        return {
          elements,
          submission: model,
        }
      })
    },
    [element.id, onLookup],
  )

  return (
    <div className="ob-section">
      <div
        className="ob-section__header cypress-section-header"
        onClick={toggle}
      >
        <h3 className="ob-section__header-text title is-3">
          {element.label}
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
        </h3>
        <div className="ob-section__header-icon-container">
          {isInvalid && (
            <i className="material-icons has-text-danger cypress-section-invalid-icon section-invalid-icon">
              warning
            </i>
          )}
          <i
            className={clsx('ob-section__header-icon material-icons', {
              'is-rotated': !isCollapsed,
            })}
          >
            expand_more
          </i>
        </div>
      </div>
      <hr className="ob-section__divider" />
      <Collapse
        in={!isCollapsed}
        classes={{ container: 'ob-section__content' }}
      >
        <OneBlinkFormElements
          {...props}
          onLookup={handleLookup}
          elements={element.elements}
        />
      </Collapse>
    </div>
  )
}

export default React.memo(FormElementSection)
