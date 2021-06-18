import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import OneBlinkFormElements from '../components/OneBlinkFormElements'

export type Props = {
  formId: number
  id: string
  element: FormTypes.FormFormElement | FormTypes.InfoPageElement
  value: FormElementsCtrl['model'] | undefined
  onChange: FormElementValueChangeHandler<FormElementsCtrl['model']>
  onLookup: FormElementLookupHandler
  formElementValidation: FormElementValidation | undefined
  displayValidationMessages: boolean
  formElementConditionallyShown: FormElementConditionallyShown | undefined
  parentFormElementsCtrl: FormElementsCtrl
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
  parentFormElementsCtrl,
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
        ] as FormElementsCtrl['model']
        const elements = currentFormSubmission.elements.map((formElement) => {
          if (
            formElement.type === 'form' &&
            formElement.name === element.name &&
            Array.isArray(formElement.elements)
          ) {
            const { elements, submission } = mergeLookupResults({
              elements: formElement.elements,
              submission: model,
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

  const formElementsCtrl = React.useMemo<FormElementsCtrl>(() => {
    return {
      model: value || {},
      elements: element.elements || [],
      parentFormElementsCtrl,
    }
  }, [element.elements, parentFormElementsCtrl, value])

  return (
    <OneBlinkFormElements
      formId={formId}
      formElementsValidation={validation}
      displayValidationMessages={displayValidationMessages}
      elements={element.elements || []}
      onChange={handleNestedChange}
      onLookup={handleLookup}
      formElementsConditionallyShown={formElementsConditionallyShown}
      formElementsCtrl={formElementsCtrl}
      idPrefix={`${id}_`}
    />
  )
}

export default React.memo(FormElementForm)
