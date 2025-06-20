import * as React from 'react'
import clsx from 'clsx'
import { Collapse } from '@mui/material'
import Tooltip from '../components/renderer/Tooltip'
import { FormTypes } from '@oneblink/types'
import useBooleanState from '../hooks/useBooleanState'
import OneBlinkFormElements, {
  Props,
} from '../components/renderer/OneBlinkFormElements'
import { checkSectionValidity } from '../services/form-validation/validators'
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
import MaterialIcon from '../components/MaterialIcon'

function FormElementSection<T extends FormTypes._NestedElementsElement>({
  element,
  onLookup,
  displayValidationMessages,
  onUpdateFormElements,
  sectionHeaderId,
  collapsedSectionIds = [],
  ...props
}: Omit<Props<T>, 'elements'> & {
  element: FormTypes.SectionElement
  sectionHeaderId: string
  collapsedSectionIds?: string[]
}) {
  const isCollapsedFromState =
    collapsedSectionIds.includes(element.id) || element.isCollapsed
  const [isCollapsed, , , toggle] = useBooleanState(isCollapsedFromState)

  const handleToggle = React.useCallback(() => {
    // trigger onChange to update the collapsedSectionIds
    props.onChange(element, {
      executedLookups: undefined,
    })
    toggle()
  }, [element, props, toggle])

  const [isDisplayingError, setIsDisplayingError] = React.useState(isCollapsed)
  const headerRef = React.useRef<HTMLDivElement>(null)
  const id = `${props['idPrefix']}${element.id}`

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
                collapsedSectionIds: currentFormSubmission.collapsedSectionIds,
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
          collapsedSectionIds: currentFormSubmission.collapsedSectionIds,
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

  const handleClickBottomCollapseButton = React.useCallback(() => {
    handleToggle()
    headerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    })
  }, [handleToggle])

  return (
    <div className={clsx('ob-section', validationClassName)}>
      <div
        className={clsx('ob-section__header cypress-section-header', {
          'ob-section__header-filled': element.canCollapseFromBottom,
        })}
        onClick={handleToggle}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleToggle()
          }
        }}
        ref={headerRef}
      >
        <h3 className="ob-section__header-text title is-3" id={sectionHeaderId}>
          {element.label}
          {element.hint &&
            (element.hintPosition === 'TOOLTIP' || !element.hintPosition) && (
              <HintTooltip hint={element.hint} inputId={id} />
            )}
        </h3>
        <div className="ob-section__header-icon-container">
          {!valid && displayValidationMessage && (
            <Tooltip title="Section has errors">
              <MaterialIcon className="has-text-danger cypress-section-invalid-icon section-invalid-icon fade-in">
                warning
              </MaterialIcon>
            </Tooltip>
          )}
          <MaterialIcon
            className={clsx('ob-section__header-icon', {
              'is-rotated': !isCollapsed,
            })}
          >
            expand_more
          </MaterialIcon>
        </div>
        {element.hint && element.hintPosition === 'BELOW_LABEL' && (
          <div className="ob-section__hint-text-container">
            <HintBelowLabel hint={element.hint} inputId={id} />
          </div>
        )}
      </div>
      {!element.canCollapseFromBottom && <hr className="ob-section__divider" />}
      <Collapse
        in={!isCollapsed}
        classes={{
          root: 'ob-section__content',
          entered: 'ob-section__expanded',
          hidden: 'ob-section__collapsed',
        }}
      >
        <SectionElementsWrapper
          element={element}
          onCollapse={handleClickBottomCollapseButton}
        >
          <OneBlinkFormElements
            {...props}
            displayValidationMessages={displayValidationMessage}
            onLookup={handleLookup}
            elements={element.elements}
            onUpdateFormElements={handleUpdateNestedFormElements}
          />
        </SectionElementsWrapper>
      </Collapse>
    </div>
  )
}

export default React.memo(FormElementSection)

const SectionElementsWrapper = ({
  children,
  element,
  onCollapse,
}: {
  children: React.ReactNode
  element: FormTypes.SectionElement
  onCollapse: () => void
}) => {
  return element.canCollapseFromBottom ? (
    <div className="ob-section__collapsible-content-container">
      {children}

      <button
        type="button"
        className="button is-rounded is-light ob-section__bottom-collapse-button"
        onClick={onCollapse}
      >
        <span className="icon">
          <MaterialIcon>expand_less</MaterialIcon>
        </span>
        <span>Collapse</span>
      </button>
    </div>
  ) : (
    <>{children}</>
  )
}
