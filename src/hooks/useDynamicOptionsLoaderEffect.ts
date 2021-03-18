import * as React from 'react'
import _cloneDeep from 'lodash.clonedeep'
import { formService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'

export default function useDynamicOptionsLoaderEffect(
  form: FormTypes.Form,
  onSetForm: React.Dispatch<React.SetStateAction<FormTypes.Form>>,
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
          const clonedForm: FormTypes.Form = _cloneDeep(currentForm)
          for (const { options, elementId } of optionsForElementId) {
            const formElement = formService.findFormElement(
              clonedForm.elements,
              (formElement) => formElement.id === elementId,
            )
            if (
              formElement &&
              (formElement.type === 'select' ||
                formElement.type === 'compliance' ||
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
