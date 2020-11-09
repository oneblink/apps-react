import { FormTypes } from '@oneblink/types'
import * as React from 'react'

export const FormDefinitionContext = React.createContext<
  FormTypes.Form | undefined
>(undefined)

export default function useFormDefinition() {
  return React.useContext(FormDefinitionContext)
}
