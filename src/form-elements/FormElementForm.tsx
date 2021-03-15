import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import OneBlinkFormElements from '../components/OneBlinkFormElements'

type Props = {
  formId: number
  id: string
  element: FormTypes.FormFormElement | FormTypes.InfoPageElement
  value: FormElementsCtrl['model'] | undefined
  onChange: (formElements: FormTypes.FormElement, value: unknown) => unknown
  onChangeElements: (formElements: FormTypes.FormElement[]) => unknown
  onChangeModel: (model: FormElementsCtrl['model']) => unknown
  formElementValidation: FormElementValidation | undefined
  displayValidationMessage: boolean
  formElementConditionallyShown: FormElementConditionallyShown | undefined
  parentFormElementsCtrl: FormElementsCtrl
}

function FormElementForm({
  formId,
  element,
  value,
  formElementValidation,
  displayValidationMessage,
  formElementConditionallyShown,
  onChange,
  onChangeElements,
  onChangeModel,
  parentFormElementsCtrl,
}: Props) {
  const handleNestedChange = React.useCallback(
    (nestedElement, nestedElementValue) => {
      if (nestedElement.type === 'page') return
      const newFormVal = {
        ...value,
        [nestedElement.name]: nestedElementValue,
      }
      onChange(element, newFormVal)
    },
    [value, onChange, element],
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
      formElementValidation.type === 'nestedForm'
      ? formElementValidation.nested
      : undefined
  }, [formElementValidation])

  const formElementsConditionallyShown = React.useMemo(() => {
    return formElementConditionallyShown &&
      formElementConditionallyShown.type === 'nestedForm'
      ? formElementConditionallyShown.nested
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
      displayValidationMessages={displayValidationMessage}
      elements={element.elements || []}
      onChange={handleNestedChange}
      onChangeElements={handleChangeElements}
      onChangeModel={handleChangeModel}
      formElementsConditionallyShown={formElementsConditionallyShown}
      formElementsCtrl={formElementsCtrl}
    />
  )
}

export default React.memo(FormElementForm)
