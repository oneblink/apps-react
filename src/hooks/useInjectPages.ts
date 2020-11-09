import { FormTypes } from '@oneblink/types'
import * as React from 'react'

type InjectPagesContextValue = (
  lookupFormElement: FormTypes.LookupFormElement,
  pageElements: FormTypes.PageElement[],
) => void

export const InjectPagesContext = React.createContext<InjectPagesContextValue>(
  () => {},
)

export default function useInjectPages() {
  return React.useContext(InjectPagesContext)
}
