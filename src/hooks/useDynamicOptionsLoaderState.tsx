import * as React from 'react'
import { formElementsService, typeCastService } from '@oneblink/sdk-core'
import {
  formService,
  localisationService,
  OneBlinkAppsError,
} from '@oneblink/apps'
import { FormTypes, FreshdeskTypes } from '@oneblink/types'
import useLoadDataState, { LoadDataState } from './useLoadDataState'
import OneBlinkAppsErrorOriginalMessage from '../components/renderer/OneBlinkAppsErrorOriginalMessage'
import useFormDefinition from './useFormDefinition'
import MaterialIcon from '../components/MaterialIcon'
import { UpdateFormElementsHandler } from '../types/form'

type OptionsSetResult = {
  formElementOptionsSet: FormTypes.FormElementOptionSet
  result?: formService.FormElementOptionsSetResult
}

export const FormElementOptionsContext = React.createContext<
  OptionsSetResult[]
>([])
export const FreshdeskFieldsStateContext = React.createContext<
  LoadDataState<FreshdeskTypes.FreshdeskField[]> | undefined
>(undefined)

export function FormElementOptionsContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const form = useFormDefinition()

  const hasFreshdeskFields = React.useMemo<boolean>(() => {
    return !!formElementsService.findFormElement(
      form.elements,
      (formElement) => {
        const formElementWithOptions =
          typeCastService.formElements.toOptionsElement(formElement)
        return (
          formElementWithOptions?.optionsType === 'FRESHDESK_FIELD' &&
          !!formElementWithOptions.freshdeskFieldName
        )
      },
    )
  }, [form.elements])

  const loadFreshdeskFields = React.useCallback(
    async (abortSignal): Promise<FreshdeskTypes.FreshdeskField[]> => {
      if (hasFreshdeskFields) {
        return await formService.getFreshdeskFields(form.id, abortSignal)
      }
      return []
    },
    [form.id, hasFreshdeskFields],
  )

  const [freshdeskFieldsState] = useLoadDataState(loadFreshdeskFields)

  const hasOptionsSets = React.useMemo<boolean>(() => {
    return !!formElementsService.findFormElement(
      form.elements,
      (formElement) => {
        const formElementWithOptions =
          typeCastService.formElements.toOptionsElement(formElement)
        return (
          formElementWithOptions?.optionsType === 'DYNAMIC' &&
          !!formElementWithOptions.dynamicOptionSetId
        )
      },
    )
  }, [form.elements])

  const loadFormElementOptionsSets = React.useCallback(
    async (abortSignal): Promise<OptionsSetResult[]> => {
      if (!hasOptionsSets) {
        return []
      }
      const formElementOptionsSets =
        await formService.getFormElementOptionsSets(
          form.organisationId,
          abortSignal,
        )
      return formElementOptionsSets.map<OptionsSetResult>(
        (formElementOptionsSet) => ({
          formElementOptionsSet,
        }),
      )
    },
    [form.organisationId, hasOptionsSets],
  )

  const [optionsSetResultsState, , setOptionsSetResults] = useLoadDataState(
    loadFormElementOptionsSets,
  )

  const optionsSetResults = React.useMemo(() => {
    if (optionsSetResultsState.status === 'SUCCESS') {
      return optionsSetResultsState.result
    }
    return []
  }, [optionsSetResultsState])

  const error = React.useMemo<OneBlinkAppsError | undefined>(() => {
    if (freshdeskFieldsState.status === 'ERROR') {
      return freshdeskFieldsState.error instanceof OneBlinkAppsError
        ? freshdeskFieldsState.error
        : new OneBlinkAppsError('An unknown error has occurred', {
            originalError: freshdeskFieldsState.error,
          })
    }
    if (optionsSetResultsState.status === 'ERROR') {
      return optionsSetResultsState.error instanceof OneBlinkAppsError
        ? optionsSetResultsState.error
        : new OneBlinkAppsError('An unknown error has occurred', {
            originalError: optionsSetResultsState.error,
          })
    }
    for (const optionsSetResult of optionsSetResults) {
      if (optionsSetResult.result?.type === 'ERROR') {
        return optionsSetResult.result.error
      }
    }
  }, [freshdeskFieldsState, optionsSetResults, optionsSetResultsState])

  if (error) {
    return (
      <>
        <div className="has-text-centered">
          <MaterialIcon className="has-text-warning icon-x-large">
            error
          </MaterialIcon>
          <h3 className="title is-3">{error.title}</h3>
          <p>{error.message}</p>
          <p className="has-text-grey">
            {localisationService.formatDatetimeLong(new Date())}
          </p>
        </div>

        <OneBlinkAppsErrorOriginalMessage error={error.originalError} />
      </>
    )
  }

  return (
    <>
      {optionsSetResults.map((optionsSetResult) => (
        <React.Fragment key={optionsSetResult.formElementOptionsSet.id}>
          <LoadOptionsSet
            optionsSetResult={optionsSetResult}
            form={form}
            setOptionsSetResults={setOptionsSetResults}
          />
        </React.Fragment>
      ))}
      <FormElementOptionsContext.Provider value={optionsSetResults}>
        <FreshdeskFieldsStateContext.Provider value={freshdeskFieldsState}>
          {children}
        </FreshdeskFieldsStateContext.Provider>
      </FormElementOptionsContext.Provider>
    </>
  )
}

const LoadOptionsSet = React.memo(function LoadOptionsSet({
  form,
  optionsSetResult,
  setOptionsSetResults,
}: {
  form: FormTypes.Form
  optionsSetResult: OptionsSetResult
  setOptionsSetResults: React.Dispatch<React.SetStateAction<OptionsSetResult[]>>
}) {
  const hasOptionsSet = React.useMemo<boolean>(() => {
    return !!formElementsService.findFormElement(
      form.elements,
      (formElement) => {
        const formElementWithOptions =
          typeCastService.formElements.toOptionsElement(formElement)

        return (
          formElementWithOptions?.optionsType === 'DYNAMIC' &&
          !formElementWithOptions.options?.length &&
          formElementWithOptions.dynamicOptionSetId ===
            optionsSetResult.formElementOptionsSet.id
        )
      },
    )
  }, [form.elements, optionsSetResult.formElementOptionsSet.id])

  const setOptionsSetResult = React.useCallback(
    (result: OptionsSetResult['result']) => {
      setOptionsSetResults((currentOptionsSetResults) => {
        return currentOptionsSetResults.map((currentOptionsSetResult) => {
          if (
            currentOptionsSetResult.formElementOptionsSet.id ===
            optionsSetResult.formElementOptionsSet.id
          ) {
            return {
              ...optionsSetResult,
              result,
            }
          } else {
            return currentOptionsSetResult
          }
        })
      })
    },
    [optionsSetResult, setOptionsSetResults],
  )

  React.useEffect(() => {
    if (!hasOptionsSet || optionsSetResult.result) {
      return
    }

    const abortController = new AbortController()

    ;(async () => {
      try {
        const result = await formService.getFormElementOptionsSetOptions(
          optionsSetResult.formElementOptionsSet,
          {
            formId: form.id,
            formsAppEnvironmentId: form.formsAppEnvironmentId,
          },
          abortController.signal,
        )
        if (!abortController.signal.aborted) {
          setOptionsSetResult(result)
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          setOptionsSetResult({
            type: 'ERROR',
            error: new OneBlinkAppsError(
              error instanceof Error
                ? error.message
                : 'An unknown error has occurred',
              {
                originalError: error instanceof Error ? error : undefined,
              },
            ),
          })
        }
      }
    })()

    return () => {
      abortController.abort()
    }
  }, [
    form.formsAppEnvironmentId,
    form.id,
    hasOptionsSet,
    optionsSetResult.formElementOptionsSet,
    optionsSetResult.result,
    setOptionsSetResult,
  ])

  return <></>
})

export function useLoadDynamicOptionsEffect(
  formElement: FormTypes.FormElementWithOptions,
  onUpdateFormElements: UpdateFormElementsHandler,
) {
  const form = useFormDefinition()
  const optionsSetResults = React.useContext(FormElementOptionsContext)
  const freshdeskFieldsState = React.useContext(FreshdeskFieldsStateContext)

  const freshdeskFieldOptionsResult = React.useMemo(() => {
    if (
      freshdeskFieldsState?.status === 'SUCCESS' &&
      // We can stop here if the options are not coming from freshdesk
      formElement.optionsType === 'FRESHDESK_FIELD' &&
      // If the element already has options, we don't need to set them again
      !Array.isArray(formElement.options)
    ) {
      return formService.parseFreshdeskFieldOptions(
        freshdeskFieldsState.result,
        formElement,
      )
    }
  }, [formElement, freshdeskFieldsState])

  const optionsSetResult = React.useMemo<OptionsSetResult | undefined>(() => {
    if (
      // We can stop here if the options are not dynamic
      formElement.optionsType !== 'DYNAMIC' ||
      // If the element already has options, we don't need to set them again
      Array.isArray(formElement.options)
    ) {
      return
    }
    return optionsSetResults.find(
      (optionsSetResult) =>
        optionsSetResult.formElementOptionsSet.id ===
          formElement.dynamicOptionSetId && optionsSetResult.result,
    )
  }, [
    formElement.dynamicOptionSetId,
    formElement.options,
    formElement.optionsType,
    optionsSetResults,
  ])

  React.useEffect(() => {
    if (!optionsSetResult && !freshdeskFieldOptionsResult) {
      return
    }

    onUpdateFormElements((formElements) => {
      return formElements.map((existingFormElement) => {
        if (existingFormElement.id === formElement.id) {
          switch (optionsSetResult?.result?.type) {
            case 'SEARCH': {
              if (formElement.type === 'autocomplete') {
                return {
                  ...existingFormElement,
                  optionsType: 'SEARCH',
                  searchUrl: optionsSetResult.result.url,
                  searchQuerystringParameter:
                    optionsSetResult.result.searchQuerystringParameter,
                }
              }
              break
            }
            case 'OPTIONS': {
              return formService.parseFormElementOptions(
                form,
                formElement,
                optionsSetResult.result.options,
              )
            }
          }

          if (freshdeskFieldOptionsResult) {
            return {
              ...existingFormElement,
              options:
                freshdeskFieldOptionsResult.type === 'OPTIONS'
                  ? freshdeskFieldOptionsResult.options
                  : [],
            }
          }
        }

        return existingFormElement
      })
    })
  }, [
    form,
    formElement,
    freshdeskFieldOptionsResult,
    onUpdateFormElements,
    optionsSetResult,
  ])
}
