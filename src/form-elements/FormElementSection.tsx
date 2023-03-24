import * as React from 'react'
import clsx from 'clsx'
import { Collapse, Tooltip } from '@mui/material'
import { FormTypes } from '@oneblink/types'
import useBooleanState from '../hooks/useBooleanState'
import OneBlinkFormElements, {
  Props,
} from '../components/renderer/OneBlinkFormElements'
import { checkSectionValidity } from '../services/form-validation'
import { FormElementLookupHandler } from '../types/form'
import {
  HintBelowLabel,
  HintTooltip,
} from '../components/renderer/FormElementLabelContainer'

function FormElementSection<T extends FormTypes._NestedElementsElement>({
  element,
  onLookup,
  displayValidationMessages,
  ...props
}: Omit<Props<T>, 'elements'> & {
  element: FormTypes.SectionElement
}) {
  const [isCollapsed, , , toggle] = useBooleanState(element.isCollapsed)
  const [isDisplayingError, setIsDisplayingError] = React.useState(isCollapsed)

  React.useEffect(() => {
    if (isCollapsed && !isDisplayingError) {
      setIsDisplayingError(true)
    }
  }, [isCollapsed, isDisplayingError])

  const displayValidationMessage =
    displayValidationMessages || isDisplayingError

  const isInvalid = React.useMemo(() => {
    return (
      displayValidationMessage &&
      checkSectionValidity(element, props.formElementsValidation)
    )
  }, [displayValidationMessage, element, props.formElementsValidation])

  const isValid = React.useMemo(() => {
    return !checkSectionValidity(element, props.formElementsValidation)
  }, [element, props.formElementsValidation])

  const handleLookup = React.useCallback<FormElementLookupHandler>(
    (mergeLookupResults) => {
      onLookup((currentFormSubmission) => {
        let model = currentFormSubmission.submission
        const elements = currentFormSubmission.elements.map((formElement) => {
          if (formElement.type === 'section' && formElement.id === element.id) {
            const { elements, submission } = mergeLookupResults({
              elements: formElement.elements,
              submission: currentFormSubmission.submission,
              lastElementUpdated: currentFormSubmission.lastElementUpdated,
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
          lastElemenetUpdated: currentFormSubmission.lastElementUpdated,
        }
      })
    },
    [element.id, onLookup],
  )

  return (
    <div
      className={clsx('ob-section', {
        'ob-section__invalid': isInvalid,
        'ob-section__valid': isValid,
      })}
    >
      <div
        className="ob-section__header cypress-section-header"
        onClick={toggle}
      >
        <h3 className="ob-section__header-text title is-3">
          {element.label}
          {element.hint &&
            (element.hintPosition === 'TOOLTIP' || !element.hintPosition) && (
              <HintTooltip hint={element.hint} />
            )}
        </h3>
        <div className="ob-section__header-icon-container">
          {isInvalid && (
            <Tooltip title="Section has errors">
              <i className="material-icons has-text-danger cypress-section-invalid-icon section-invalid-icon fade-in">
                warning
              </i>
            </Tooltip>
          )}
          <i
            className={clsx('ob-section__header-icon material-icons', {
              'is-rotated': !isCollapsed,
            })}
          >
            expand_more
          </i>
        </div>
        {element.hint && element.hintPosition === 'BELOW_LABEL' && (
          <div className="ob-section__hint-text-container">
            <HintBelowLabel hint={element.hint} />
          </div>
        )}
      </div>
      <hr className="ob-section__divider" />
      <Collapse
        in={!isCollapsed}
        classes={{
          root: 'ob-section__content',
          entered: 'ob-section__expanded',
          hidden: 'ob-section__collapsed',
        }}
      >
        <OneBlinkFormElements
          {...props}
          displayValidationMessages={displayValidationMessage}
          onLookup={handleLookup}
          elements={element.elements}
        />
      </Collapse>
    </div>
  )
}

export default React.memo(FormElementSection)
