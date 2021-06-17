import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import OneBlinkFormElements from '../components/OneBlinkFormElements'

export type Props = {
  formId: number
  id: string
  element: FormTypes.FormFormElement | FormTypes.InfoPageElement
  value: FormElementsCtrl['model'] | undefined
  onChange: FormElementValueChangeHandler<FormElementsCtrl['model']>
  onChangeElements: (formElements: FormTypes.FormElement[]) => unknown
  onChangeModel: (model: FormElementsCtrl['model']) => unknown
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
  onChangeElements,
  onChangeModel,
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
    [onChange, element],
  )
  const handleChangeElements = React.useCallback(
    (elements) => {
      onChangeElements(
        parentFormElementsCtrl.elements.map((parentElement) => {
          if (parentElement.id === element.id) {
            return {
              ...parentElement,
              elements,
            }
          }
          return parentElement
        }),
      )
    },
    [element.id, onChangeElements, parentFormElementsCtrl.elements],
  )
  const handleChangeModel = React.useCallback(
    (model) => {
      onChangeModel({
        ...parentFormElementsCtrl.model,
        [element.name]: model,
      })
    },
    [element.name, onChangeModel, parentFormElementsCtrl.model],
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
      onChangeElements={handleChangeElements}
      onChangeModel={handleChangeModel}
      formElementsConditionallyShown={formElementsConditionallyShown}
      formElementsCtrl={formElementsCtrl}
      idPrefix={`${id}_`}
    />
  )
}

export default React.memo(FormElementForm)
