// @flow

import * as React from 'react'

export const FormDefinitionContext /* : React.Context<Form> */ = React.createContext(
  {},
)

export default function useFormDefinition() {
  return React.useContext(FormDefinitionContext)
}
