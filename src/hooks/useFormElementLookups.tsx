import * as React from 'react'
import { formElementsService, typeCastService } from '@oneblink/sdk-core'
import { formService } from '@oneblink/apps'
import useFormDefinition from './useFormDefinition'
import useLoadResourcesState from './useLoadResourcesState'

type FormElementLookupsContextValue = {
  formElementLookups: formService.FormElementLookupResult[]
  isLoading: boolean
  loadError: Error | null
  onTryAgain: (abortSignal?: AbortSignal) => void
}

const FormElementLookupsContext = React.createContext<
  FormElementLookupsContextValue | undefined
>(undefined)

export function FormElementLookupsContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const form = useFormDefinition()
  const hasLookups = React.useMemo(() => {
    return !!formElementsService.findFormElement(
      form.elements,
      (formElement) => {
        const lookupFormElement =
          typeCastService.formElements.toLookupElement(formElement)
        return !!(
          lookupFormElement &&
          (lookupFormElement.isDataLookup || lookupFormElement.isElementLookup)
        )
      },
    )
  }, [form.elements])

  const loadFormElementLookups = React.useCallback(
    async (abortSignal: AbortSignal | undefined) => {
      if (hasLookups) {
        return await formService.getFormElementLookups(
          form.organisationId,
          form.formsAppEnvironmentId,
          abortSignal,
        )
      }
      return []
    },
    [form.formsAppEnvironmentId, form.organisationId, hasLookups],
  )

  const [formElementLookups, isLoading, loadError, onTryAgain] =
    useLoadResourcesState(loadFormElementLookups)

  const value = React.useMemo<FormElementLookupsContextValue>(() => {
    return {
      formElementLookups,
      isLoading,
      loadError,
      onTryAgain,
    }
  }, [formElementLookups, isLoading, loadError, onTryAgain])

  return (
    <FormElementLookupsContext.Provider value={value}>
      {children}
    </FormElementLookupsContext.Provider>
  )
}

export default function useFormElementLookups() {
  const formElementLookupsContext = React.useContext(FormElementLookupsContext)
  if (!formElementLookupsContext) {
    throw new Error(
      '"FormElementLookupsContext" does not have a value in this context',
    )
  }
  return formElementLookupsContext
}
