import * as React from 'react'
import useFormStoreTable from './table/useFormStoreTable'
export type FormStoreTableContextValue =
  | ReturnType<typeof useFormStoreTable>
  | undefined

export const FormStoreTableContext =
  React.createContext<FormStoreTableContextValue>(undefined)

export default function useFormStoreTableContext() {
  const formStoreTableContext = React.useContext(FormStoreTableContext)
  if (!formStoreTableContext) {
    throw new TypeError(
      'You have attempted to run the hook "useFormStoreTableContext()" outside of the "FormStoreTableContext" context.',
    )
  }
  return formStoreTableContext
}
