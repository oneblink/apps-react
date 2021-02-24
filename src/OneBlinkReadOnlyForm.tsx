import * as React from 'react'

import { FormTypes } from '@oneblink/types'

import OneBlinkFormBase from './OneBlinkFormBase'

import _cloneDeep from 'lodash.clonedeep'

function recursivelySetReadOnly(formElements: FormTypes.FormElement[]) {
  const newFormElements = formElements.map((element) => {
    if (
      (element.type === 'form' ||
        element.type === 'page' ||
        element.type === 'repeatableSet') &&
      Array.isArray(element.elements)
    ) {
      element.elements = recursivelySetReadOnly(element.elements)
    } else if (
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
    return element
  })
  return newFormElements
}

type Props = {
  form: FormTypes.Form
  initialSubmission?: FormElementsCtrl['model'] | null
  googleMapsApiKey?: string
  onFormError: () => unknown
}

function OneBlinkFormReadOnly({
  googleMapsApiKey,
  form,
  initialSubmission,
  onFormError,
}: Props) {

  const definition = React.useMemo(() => {
    const clonedForm = _cloneDeep(form)
    const newElements = recursivelySetReadOnly(clonedForm.elements)
    return { ...clonedForm, elements: newElements }
  }, [form])

  return (
    <OneBlinkFormBase
      form={definition}
      disabled={true}
      googleMapsApiKey={googleMapsApiKey}
      initialSubmission={initialSubmission}
      isReadOnly={true}
      onCloseConditionalLogicErrorModal={onFormError}
    />
  )
}

export default React.memo(OneBlinkFormReadOnly)
