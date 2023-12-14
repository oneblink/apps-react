import * as React from 'react'
import clsx from 'clsx'
import { Collapse, Tooltip } from '@mui/material'
import { FormTypes } from '@oneblink/types'
import useBooleanState from '../hooks/useBooleanState'
import OneBlinkFormElements, {
  Props,
} from '../components/renderer/OneBlinkFormElements'
import { checkSectionValidity } from '../services/form-validation'
import {
  FormElementLookupHandler,
  UpdateFormElementsHandler,
  ExecutedLookups,
} from '../types/form'
import {
  HintBelowLabel,
  HintTooltip,
} from '../components/renderer/FormElementLabelContainer'
import useValidationClass from '../hooks/useValidationClass'

function FormElementSection<T extends FormTypes._NestedElementsElement>({
  element,
  onLookup,
  displayValidationMessages,
  onUpdateFormElements,
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

  const isValid = React.useMemo(
    () => !checkSectionValidity(element, props.formElementsValidation),
    [element, props.formElementsValidation],
  )

  const { validationClassName, valid } = useValidationClass({
    formElementsValid: isValid,
    displayInvalidClassName: displayValidationMessage,
    validClassName: 'ob-section__valid',
    invalidClassName: 'ob-section__invalid',
  })

  const handleLookup = React.useCallback<FormElementLookupHandler>(
    (mergeLookupResults) => {
      onLookup((currentFormSubmission) => {
        let model = currentFormSubmission.submission
        let newExecutedLookups: ExecutedLookups = {}
        const elements = currentFormSubmission.elements.map((formElement) => {
          if (formElement.type === 'section' && formElement.id === element.id) {
            const { elements, submission, executedLookups } =
              mergeLookupResults({
                elements: formElement.elements,
                submission: currentFormSubmission.submission,
                lastElementUpdated: currentFormSubmission.lastElementUpdated,
                executedLookups: currentFormSubmission.executedLookups,
              })
            model = submission
            newExecutedLookups = executedLookups
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
          lastElementUpdated: currentFormSubmission.lastElementUpdated,
          executedLookups: newExecutedLookups,
        }
      })
    },
    [element.id, onLookup],
  )

  const handleUpdateNestedFormElements =
    React.useCallback<UpdateFormElementsHandler>(
      (setter) => {
        onUpdateFormElements((formElements) => {
          return formElements.map((formElement) => {
            if (
              formElement.id === element.id &&
              formElement.type === 'section'
            ) {
              return {
                ...formElement,
                elements: setter(formElement.elements),
              }
            }
            return formElement
          })
        })
      },
      [element.id, onUpdateFormElements],
    )

  return (
    <div className={clsx('ob-section', validationClassName)}>
      <div
        className="ob-section__header cypress-section-header"
        onClick={toggle}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            toggle()
          }
        }}
      >
        <h3 className="ob-section__header-text title is-3">
          {element.label}
          {element.hint &&
            (element.hintPosition === 'TOOLTIP' || !element.hintPosition) && (
              <HintTooltip hint={element.hint} />
            )}
        </h3>
        <div className="ob-section__header-icon-container">
          {!valid && displayValidationMessage && (
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
          onUpdateFormElements={handleUpdateNestedFormElements}
        />
      </Collapse>
    </div>
  )
}

export default React.memo(FormElementSection)
