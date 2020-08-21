// @flow

import * as React from 'react'

export const FlattenElementsContext /* : React.Context<FormElement[]> */ = React.createContext(
  [],
)

export default function useFlattenElements() {
  return React.useContext(FlattenElementsContext)
}
