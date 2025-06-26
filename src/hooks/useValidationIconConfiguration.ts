import * as React from 'react'

export const ValidationIconConfigurationContext = React.createContext<
  | {
      icon: string
      accessibleLabel?: string
    }
  | undefined
>(undefined)

export default function useValidationIconConfiguration() {
  return React.useContext(ValidationIconConfigurationContext)
}
