import * as React from 'react'
import LoadingWithMessage from '../LoadingWithMessage'
import ErrorMessage from '../messages/ErrorMessage'
import { formStoreService } from '@oneblink/apps'
import useLoadDataState from '../../hooks/useLoadDataState'
import { FormTypes } from '@oneblink/types'
import { Box } from '@mui/material'
import { FormStoreTableProvider } from './FormStoreTableProvider'

export type FormStoreElementsContextValue = FormTypes.FormElementWithName[]

export const FormStoreElementsContext =
  React.createContext<FormStoreElementsContextValue>([])

export function OneBlinkFormStoreProvider({
  form,
  children,
}: {
  form: FormTypes.Form
  children: React.ReactNode
}) {
  const fetchFormStoreDefinition = React.useCallback(
    (abortSignal?: AbortSignal) => {
      return formStoreService.getFormStoreDefinition(form.id, abortSignal)
    },
    [form.id],
  )
  const [formStoreDefinitionState, onTryAgain] = useLoadDataState(
    fetchFormStoreDefinition,
  )

  if (formStoreDefinitionState.status === 'LOADING') {
    return <LoadingWithMessage />
  }

  if (formStoreDefinitionState.status === 'ERROR') {
    return (
      <>
        <ErrorMessage
          title="Error Retrieving Form Definition"
          gutterTop
          onTryAgain={onTryAgain}
        >
          {formStoreDefinitionState.error.message}
        </ErrorMessage>
      </>
    )
  }

  return (
    <FormStoreElementsContext.Provider
      value={formStoreDefinitionState.result.formElements}
    >
      <Box paddingBottom={16}>
        <FormStoreTableProvider form={form}>{children}</FormStoreTableProvider>
      </Box>
    </FormStoreElementsContext.Provider>
  )
}
