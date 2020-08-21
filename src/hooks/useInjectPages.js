// @flow

import * as React from 'react'

/* ::
type InjectPagesContextValue = (LookupFormElement, PageElement[]) => void
*/

export const InjectPagesContext /* : React.Context<InjectPagesContextValue> */ = React.createContext(
  () => {},
)

export default function useInjectPages() {
  return React.useContext(InjectPagesContext)
}
