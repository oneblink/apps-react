import * as React from 'react'

import { FormTypes } from '@oneblink/types'

import OneBlinkFormBase from './OneBlinkFormBase'

import _cloneDeep from 'lodash.clonedeep'

function recursivelySetReadOnly(formElements: FormTypes.FormElement[]) {
  const newFormElements = formElements.reduce<FormTypes.FormElement[]>(
    (elements, element) => {
      if (
        (element.type === 'form' ||
          element.type === 'page' ||
          element.type === 'repeatableSet') &&
        Array.isArray(element.elements)
      ) {
        element.elements = recursivelySetReadOnly(element.elements)
      }

      if (
        element.type !== 'heading' &&
        element.type !== 'page' &&
        element.type !== 'html' &&
        element.type !== 'captcha' &&
        element.type !== 'image' &&
        element.type !== 'calculation' &&
        element.type !== 'summary' &&
        element.type !== 'form' &&
        element.type !== 'infoPage'
      ) {
        element.readOnly = true
      }

      if (element.type !== 'captcha') {
        elements.push(element)
      }

      return elements
    },
    [],
  )
  return newFormElements
}

type Props = {
  form: FormTypes.Form
  initialSubmission?: FormElementsCtrl['model'] | null
  googleMapsApiKey?: string
}

function OneBlinkFormReadOnly({ form, ...rest }: Props) {
  const definition = React.useMemo(() => {
    const clonedForm = _cloneDeep(form)
    const newElements = recursivelySetReadOnly(clonedForm.elements)
    return { ...clonedForm, elements: newElements }
  }, [form])

  return (
    <OneBlinkFormBase
      form={definition}
      disabled={true}
      isReadOnly={true}
      {...rest}
    />
  )
}

export default React.memo(OneBlinkFormReadOnly)
