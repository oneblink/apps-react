// @flow

import * as React from 'react'

export const FlattenElementsContext = React.createContext<FormElement[]>([])

export default function useFlattenElements() {
  return React.useContext(FlattenElementsContext)
}
