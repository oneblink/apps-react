import { FormTypes } from '@oneblink/types'
import * as React from 'react'

export const FlattenElementsContext = React.createContext<
  FormTypes.FormElement[]
>([])

export default function useFlattenElements() {
  return React.useContext(FlattenElementsContext)
}
