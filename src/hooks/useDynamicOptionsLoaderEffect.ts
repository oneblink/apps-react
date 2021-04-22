import * as React from 'react'
import _cloneDeep from 'lodash.clonedeep'
import { formService, Sentry } from '@oneblink/apps'
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
            formService.forEachFormElementWithOptions(
              clonedForm.elements,
              (formElement) => {
                if (formElement.id === elementId) {
                  formElement.options = options
                }
              },
            )
          }
          return clonedForm
        })
      } catch (error) {
        Sentry.captureException(error)
        console.warn('Could not set dynamic options for form', error)
      }
    })()

    return () => {
      ignore = true
    }
  }, [form, onSetForm])
}
