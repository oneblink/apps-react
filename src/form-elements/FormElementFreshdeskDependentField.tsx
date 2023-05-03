import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import FormElementForm, { Props } from './FormElementForm'
import generateFreshdeskDependentFieldElements, {
  getNestedOptions,
} from '../services/generateFreshdeskDependentFieldElements'

function FormElementFreshdeskDependentField({
  element,
  ...props
}: Omit<Props, 'element'> & {
  element: FormTypes.FreshdeskDependentFieldElement
}) {
  const freshdeskElements = React.useMemo(
    () => generateFreshdeskDependentFieldElements(element),
    [element],
  )

  const formElement = React.useMemo<FormTypes.FormFormElement>(() => {
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

  return <FormElementForm element={formElement} {...props} />
}

export default React.memo(FormElementFreshdeskDependentField)
