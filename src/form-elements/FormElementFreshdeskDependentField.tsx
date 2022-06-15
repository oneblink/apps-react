import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import FormElementForm, { Props } from './FormElementForm'
import generateFreshdeskDependentFieldElements from '../services/generateFreshdeskDependentFieldElements'

function FormElementFreshdeskDependentField({
  element,
  ...props
}: Omit<Props, 'element'> & {
  element: FormTypes.FreshdeskDependentFieldElement
}) {
  const formElement = React.useMemo<FormTypes.FormFormElement>(() => {
    return {
      ...element,
      type: 'form',
      formId: NaN,
      elements: generateFreshdeskDependentFieldElements(element, props.value),
    }
  }, [element, props.value])

  return <FormElementForm element={formElement} {...props} />
}

export default React.memo(FormElementFreshdeskDependentField)
