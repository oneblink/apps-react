// @flow
'use strict'

import * as React from 'react'
import OneBlinkFormElements from 'form/components/OneBlinkFormElements'

type Props = {
  id: string,
  element: FormFormElement | InfoPageElement,
  value: $PropertyType<FormElementsCtrl, 'model'>,
  onChange: (FormElement, mixed) => mixed,
  onChangeElements: (FormElement[]) => mixed,
  onChangeModel: ($PropertyType<FormElementsCtrl, 'model'>) => mixed,
  formElementValidation: FormElementValidation,
  displayValidationMessage: boolean,
  formElementConditionallyShown: FormElementConditionallyShown | void,
  parentFormName?: string,
  parentFormElementsCtrl: FormElementsCtrl,
}

function FormElementForm({
  element,
  value,
  formElementValidation,
  displayValidationMessage,
  formElementConditionallyShown,
  onChange,
  onChangeElements,
  onChangeModel,
  parentFormName,
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
            // Stupid flow can't workout what type of element it is...
            // Wants "type: 'actual string of type'" which is not going to happen!
            // $FlowFixMe
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

  return (
    <OneBlinkFormElements
      model={value}
      formElementsValidation={validation}
      displayValidationMessages={displayValidationMessage}
      elements={element.elements || []}
      onChange={handleNestedChange}
      onChangeElements={handleChangeElements}
      onChangeModel={handleChangeModel}
      formElementsConditionallyShown={formElementsConditionallyShown}
      parentFormName={parentFormName}
      parentFormElementsCtrl={parentFormElementsCtrl}
    />
  )
}

export default React.memo<Props>(FormElementForm)
