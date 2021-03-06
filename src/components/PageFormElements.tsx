import * as React from 'react'
import clsx from 'clsx'
import { FormTypes } from '@oneblink/types'
import OneBlinkFormElements from './OneBlinkFormElements'
import useFormDefinition from '../hooks/useFormDefinition'
import {
  FormElementLookupHandler,
  FormElementsConditionallyShown,
  FormElementsValidation,
  FormElementValueChangeHandler,
  FormSubmissionModel,
  SetFormSubmission,
} from '../types/form'

export type Props = {
  formId: number
  isActive: boolean
  pageElement: FormTypes.PageElement
  displayValidationMessages: boolean
  model: FormSubmissionModel
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  formElementsValidation: FormElementsValidation | undefined
  onChange: FormElementValueChangeHandler
  setFormSubmission: SetFormSubmission
}

function PageFormElements({
  formId,
  isActive,
  pageElement,
  model,
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

  const form = useFormDefinition()

  return (
    <div
      key={pageElement.id}
      className={clsx('ob-page step-content is-active cypress-page', {
        'is-invisible': !isActive,
      })}
    >
      <OneBlinkFormElements
        formId={formId}
        model={model}
        parentElement={form}
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
