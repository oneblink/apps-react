import * as React from 'react'
import _cloneDeep from 'lodash.clonedeep'
import { formService, OneBlinkAppsError } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'

export default function useDynamicOptionsLoaderState(
  form: FormTypes.Form,
  onSetForm: React.Dispatch<React.SetStateAction<FormTypes.Form>>,
): {
  elementId: string
  error: OneBlinkAppsError
} | null {
  const [state, setState] = React.useState<
    ReturnType<typeof useDynamicOptionsLoaderState>
  >(null)
  React.useEffect(() => {
    if (state) {
      return
    }

    let ignore = false

    ;(async () => {
      const optionsByElementId = await formService.getFormElementDynamicOptions(
        form,
      )

      if (ignore || !optionsByElementId.length) {
        return
      }

      const nonOkResponse = optionsByElementId.find(
        (optionsForElementId) => !optionsForElementId.ok,
      )
      if (nonOkResponse && !nonOkResponse.ok) {
        setState(nonOkResponse)
        return
      }

      onSetForm((currentForm) => {
        const clonedForm: FormTypes.Form = _cloneDeep(currentForm)
        for (const optionsForElementId of optionsByElementId) {
          if (optionsForElementId.ok) {
            formService.forEachFormElementWithOptions(
              clonedForm.elements,
              (formElement) => {
                if (formElement.id === optionsForElementId.elementId) {
                  formElement.options = optionsForElementId.options
                }
              },
            )
          }
        }
        return clonedForm
      })
    })()

    return () => {
      ignore = true
    }
  }, [form, onSetForm, state])

  return state
}
