import * as React from 'react'

export const FormIsReadOnlyContext = React.createContext<boolean>(false)

export default function useFormIsReadOnly() {
  return React.useContext(FormIsReadOnlyContext)
}
