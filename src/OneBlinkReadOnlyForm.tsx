import * as React from 'react'

import { FormTypes } from '@oneblink/types'

import OneBlinkFormBase from './OneBlinkFormBase'

import _cloneDeep from 'lodash.clonedeep'

function recursivelySetReadOnly(formElements: FormTypes.FormElement[]) {
  const newFormElements = formElements.map((element) => {
    if (
      (element.type === 'form') &&
      Array.isArray(element.elements)
    ) {
      element.elements = recursivelySetReadOnly(element.elements)
    }
    if ('readOnly' in element) {
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
  const [definition, setDefinition] = React.useState<FormTypes.Form>(() =>
    _cloneDeep(form),
  )

  React.useCallback(() => {
    const newElements = recursivelySetReadOnly(form.elements)
    const newDefinition = { ...form, elements: newElements }
    setDefinition(newDefinition)
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
