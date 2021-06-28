import { FormTypes } from '@oneblink/types'
import * as React from 'react'

export const FormDefinitionContext = React.createContext<
  FormTypes.Form | undefined
>(undefined)

export default function useFormDefinition() {
  const form = React.useContext(FormDefinitionContext)
  if (!form) {
    throw new Error('<FormDefinitionContext.Provider> does not have a value')
  }
  return form
}
