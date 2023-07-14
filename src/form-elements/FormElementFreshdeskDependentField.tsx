import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import FormElementForm, { Props } from './FormElementForm'
import generateFreshdeskDependentFieldElements, {
  getNestedOptions,
} from '../services/generateFreshdeskDependentFieldElements'
import { UpdateFormElementsHandler } from '../typedoc'
import { typeCastService } from '@oneblink/sdk-core'

function FormElementFreshdeskDependentField({
  element,
  onUpdateFormElements,
  ...props
}: Omit<Props, 'element'> & {
  element: FormTypes.FreshdeskDependentFieldElement
}) {
  const freshdeskElements = React.useMemo(
    () => generateFreshdeskDependentFieldElements(element),
    [element],
  )

  const formFormElement = React.useMemo<FormTypes.FormFormElement>(() => {
    const [categoryElement, subcategoryElement, itemElement] = freshdeskElements
    const elements = [categoryElement]
    const value = props.value as
      | FormTypes.FreshdeskDependentFieldElementValue
      | undefined

    if (props.value?.category) {
      const subCategoryOptions = getNestedOptions(
        element.options,
        value?.category,
      )
      subcategoryElement.options = subCategoryOptions
      elements.push(subcategoryElement)

      if (value?.subCategory) {
        const itemOptions = getNestedOptions(
          subCategoryOptions,
          value?.subCategory,
        )
        itemElement.options = itemOptions
        elements.push(itemElement)
      }
    }

    return {
      ...element,
      type: 'form',
      formId: NaN,
      elements,
    }
  }, [element, props.value, freshdeskElements])

  const handleUpdateNestedFormElements =
    React.useCallback<UpdateFormElementsHandler>(
      (setter) => {
        const [newFormFormElement] = setter([formFormElement])
        if (
          newFormFormElement.type !== 'form' ||
          !Array.isArray(newFormFormElement.elements) ||
          !newFormFormElement.elements[0]
        ) {
          return
        }
        const categoryElementWithOptions =
          typeCastService.formElements.toOptionsElement(
            newFormFormElement.elements[0],
          )
        if (!categoryElementWithOptions?.options) {
          return
        }

        onUpdateFormElements((formElements) => {
          return formElements.map((formElement) => {
            if (formElement.id === element.id) {
              return {
                ...formElement,
                options: categoryElementWithOptions.options,
              }
            }
            return formElement
          })
        })
      },
      [element.id, formFormElement, onUpdateFormElements],
    )

  return (
    <FormElementForm
      element={formFormElement}
      onUpdateFormElements={handleUpdateNestedFormElements}
      {...props}
    />
  )
}

export default React.memo(FormElementFreshdeskDependentField)
