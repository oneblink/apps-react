// @flow

import * as React from 'react'

type InjectPagesContextValue = (LookupFormElement, PageElement[]) => void

export const InjectPagesContext = React.createContext<InjectPagesContextValue>(
  () => {},
)

export default function useInjectPages() {
  return React.useContext(InjectPagesContext)
}
