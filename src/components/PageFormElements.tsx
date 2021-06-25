import * as React from 'react'
import clsx from 'clsx'
import { FormTypes } from '@oneblink/types'
import OneBlinkFormElements from './OneBlinkFormElements'

export type Props = {
  formId: number
  isActive: boolean
  pageElement: FormTypes.PageElement
  displayValidationMessages: boolean
  formElementsCtrl: FormElementsCtrl
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  formElementsValidation: FormElementsValidation | undefined
  onChange: FormElementValueChangeHandler
  setFormSubmission: SetFormSubmission
}

function PageFormElements({
  formId,
  isActive,
  pageElement,
  formElementsCtrl,
  displayValidationMessages,
  formElementsConditionallyShown,
  formElementsValidation,
  onChange,
  setFormSubmission,
}: Props) {
  const handleLookup = React.useCallback<FormElementLookupHandler>(
    (mergeLookupResults) => {
      setFormSubmission((currentFormSubmission) => {
        const { submission, elements } = mergeLookupResults({
          elements: pageElement.elements,
          submission: currentFormSubmission.submission,
        })

        const definition = {
          ...currentFormSubmission.definition,
        }
        if (pageElement.id === formId.toString()) {
          definition.elements = elements
        } else {
          definition.elements = currentFormSubmission.definition.elements.map(
            (formElement) => {
              if (
                formElement.id === pageElement.id &&
                formElement.type === 'page'
              ) {
                return {
                  ...formElement,
                  elements,
                }
              } else {
                return formElement
              }
            },
          )
        }

        return {
          submission,
          definition,
        }
      })
    },
    [formId, pageElement.elements, pageElement.id, setFormSubmission],
  )

  return (
    <div
      key={pageElement.id}
      className={clsx('ob-page step-content is-active cypress-page', {
        'is-invisible': !isActive,
      })}
    >
      <OneBlinkFormElements
        formId={formId}
        formElementsCtrl={formElementsCtrl}
        formElementsConditionallyShown={formElementsConditionallyShown}
        formElementsValidation={formElementsValidation}
        displayValidationMessages={displayValidationMessages}
        elements={pageElement.elements}
        onChange={onChange}
        onLookup={handleLookup}
        idPrefix=""
      />
    </div>
  )
}

export default React.memo(PageFormElements)
