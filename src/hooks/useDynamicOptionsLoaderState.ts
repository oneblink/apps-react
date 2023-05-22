import * as React from 'react'
import _cloneDeep from 'lodash.clonedeep'
import { formElementsService } from '@oneblink/sdk-core'
import { formService, OneBlinkAppsError } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import { SetFormSubmission } from '../types/form'

export default function useDynamicOptionsLoaderState(
  form: FormTypes.Form,
  setFormSubmission: SetFormSubmission,
) {
  const [state, setState] = React.useState<{
    elementId: string
    error: OneBlinkAppsError
  } | null>(null)
  React.useEffect(() => {
    if (state) {
      return
    }

    const abortController = new AbortController()

    ;(async () => {
      const optionsByElementId = await formService.getFormElementDynamicOptions(
        form,
      )

      if (abortController.signal.aborted || !optionsByElementId.length) {
        return
      }

      const nonOkResponse = optionsByElementId.find(
        (optionsForElementId) => optionsForElementId.type === 'ERROR',
      )
      if (nonOkResponse && nonOkResponse.type === 'ERROR') {
        setState({
          elementId: nonOkResponse.elementId,
          error: nonOkResponse.error,
        })
        return
      }

      setFormSubmission((currentFormSubmission) => {
        const clonedForm: FormTypes.Form = _cloneDeep(
          currentFormSubmission.definition,
        )
        for (const optionsForElementId of optionsByElementId) {
          formElementsService.forEachFormElementWithOptions(
            clonedForm.elements,
            (formElement) => {
              if (formElement.id === optionsForElementId.elementId) {
                switch (optionsForElementId.type) {
                  case 'OPTIONS': {
                    formElement.options = optionsForElementId.options
                    break
                  }
                  case 'SEARCH': {
                    if (formElement.type === 'autocomplete') {
                      formElement.optionsType = 'SEARCH'
                      formElement.searchUrl = optionsForElementId.url
                      formElement.searchQuerystringParameter =
                        optionsForElementId.searchQuerystringParameter
                    }
                    break
                  }
                }
              }
            },
          )
        }
        return {
          ...currentFormSubmission,
          definition: clonedForm,
        }
      })
    })()

    return () => {
      abortController.abort()
    }
  }, [form, setFormSubmission, state])

  return state
}
