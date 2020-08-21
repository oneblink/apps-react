// @flow
'use strict'

import * as React from 'react'
import _cloneDeep from 'lodash.clonedeep'
import { formService } from '@oneblink/apps'

export default function useDynamicOptionsLoaderEffect(
  form /* : Form */,
  onSetForm /* : ((Form) => Form) => void */,
) {
  React.useEffect(() => {
    let ignore = false

    ;(async () => {
      try {
        const optionsForElementId = await formService.getFormElementDynamicOptions(
          form,
        )
        if (ignore || !optionsForElementId.length) {
          return
        }
        onSetForm((currentForm) => {
          const clonedForm /* : Form */ = _cloneDeep(currentForm)
          for (const { options, elementId } of optionsForElementId) {
            const formElement = formService.findFormElement(
              clonedForm.elements,
              (formElement) => formElement.id === elementId,
            )
            if (
              formElement &&
              (formElement.type === 'select' ||
                formElement.type === 'autocomplete' ||
                formElement.type === 'checkboxes' ||
                formElement.type === 'radio')
            ) {
              formElement.options = options
            }
          }
          return clonedForm
        })
      } catch (error) {
        console.warn('Could not set dynamic options for form', error)
      }
    })()

    return () => {
      ignore = true
    }
  }, [form, onSetForm])
}
