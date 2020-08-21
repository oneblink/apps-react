// @flow

import * as React from 'react'

export const FormDefinitionContext = React.createContext<Form>({})

export default function useFormDefinition() {
  return React.useContext(FormDefinitionContext)
}
