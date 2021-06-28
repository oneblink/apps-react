import * as React from 'react'
import _cloneDeep from 'lodash.clonedeep'
import { formService, OneBlinkAppsError } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import { SetFormSubmission } from '../types/form'

export default function useDynamicOptionsLoaderState(
  form: FormTypes.Form,
  setFormSubmission: SetFormSubmission,
): {
  elementId: string
  error: OneBlinkAppsError
} | null {
  const [state, setState] =
    React.useState<ReturnType<typeof useDynamicOptionsLoaderState>>(null)
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

      setFormSubmission((currentFormSubmission) => {
        const clonedForm: FormTypes.Form = _cloneDeep(
          currentFormSubmission.definition,
        )
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
        return {
          ...currentFormSubmission,
          definition: clonedForm,
        }
      })
    })()

    return () => {
      ignore = true
    }
  }, [form, setFormSubmission, state])

  return state
}
