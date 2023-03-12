import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import OneBlinkFormElements from '../components/renderer/OneBlinkFormElements'
import {
  FormElementConditionallyShown,
  FormElementLookupHandler,
  FormElementValidation,
  FormElementValueChangeHandler,
  FormSubmissionModel,
} from '../types/form'

export type Props = {
  formId: number
  id: string
  element: FormTypes.FormFormElement
  value: FormSubmissionModel | undefined
  onChange: FormElementValueChangeHandler<FormSubmissionModel>
  onLookup: FormElementLookupHandler
  formElementValidation: FormElementValidation | undefined
  displayValidationMessages: boolean
  formElementConditionallyShown: FormElementConditionallyShown | undefined
}

function FormElementForm({
  formId,
  element,
  value,
  id,
  formElementValidation,
  displayValidationMessages,
  formElementConditionallyShown,
  onChange,
  onLookup,
}: Props) {
  const handleNestedChange = React.useCallback(
    (nestedElement, nestedElementValue) => {
      if (nestedElement.type === 'page') return
      onChange(element, (existingValue) => ({
        ...existingValue,
        [nestedElement.name]:
          typeof nestedElementValue === 'function'
            ? nestedElementValue(
                existingValue ? existingValue[nestedElement.name] : undefined,
              )
            : nestedElementValue,
      }))
    },
    [element, onChange],
  )

  const handleLookup = React.useCallback<FormElementLookupHandler>(
    (mergeLookupResults) => {
      onLookup((currentFormSubmission) => {
        let model = currentFormSubmission.submission[
          element.name
        ] as FormSubmissionModel
        const elements = currentFormSubmission.elements.map((formElement) => {
          if (
            formElement.type === 'form' &&
            formElement.name === element.name &&
            Array.isArray(formElement.elements)
          ) {
            const { elements, submission } = mergeLookupResults({
              elements: formElement.elements,
              submission: model,
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

        const submission = {
          ...currentFormSubmission.submission,
          [element.name]: model,
        }

        return {
          elements,
          submission,
          lastElementUpdated: currentFormSubmission.lastElementUpdated,
        }
      })
    },
    [element.name, onLookup],
  )

  const validation = React.useMemo(() => {
    return !!formElementValidation &&
      typeof formElementValidation !== 'string' &&
      formElementValidation.type === 'formElements'
      ? formElementValidation.formElements
      : undefined
  }, [formElementValidation])

  const formElementsConditionallyShown = React.useMemo(() => {
    return formElementConditionallyShown &&
      formElementConditionallyShown.type === 'formElements'
      ? formElementConditionallyShown.formElements
      : undefined
  }, [formElementConditionallyShown])

  const parentElement = React.useMemo(() => {
    return {
      elements: Array.isArray(element.elements) ? element.elements : [],
    }
  }, [element.elements])

  return (
    <OneBlinkFormElements
      formId={formId}
      formElementsValidation={validation}
      displayValidationMessages={displayValidationMessages}
      elements={parentElement.elements}
      onChange={handleNestedChange}
      onLookup={handleLookup}
      formElementsConditionallyShown={formElementsConditionallyShown}
      model={value || {}}
      parentElement={parentElement}
      idPrefix={`${id}_`}
    />
  )
}

export default React.memo(FormElementForm)
