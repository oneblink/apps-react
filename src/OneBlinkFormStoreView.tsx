import * as React from 'react'
import LoadingWithMessage from './components/LoadingWithMessage'
import ErrorMessage from './components/ErrorMessage'
import FormStore from './components/formStore/FormStore'
import { formStoreService } from '@oneblink/apps'
import useLoadDataState from './hooks/useLoadDataState'
import { FormTypes } from '@oneblink/types'

function OneBlinkFormStoreView({ form }: { form: FormTypes.Form }) {
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
    <FormStore
      form={form}
      formElements={formStoreDefinitionState.result.formElements}
    />
  )
}

export default React.memo(OneBlinkFormStoreView)
