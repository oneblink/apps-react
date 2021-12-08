import * as React from 'react'

export const AbnLookupAuthenticationGuidContext = React.createContext<
  string | undefined
>(undefined)

export default function useAbnLookupAuthenticationGuid() {
  return React.useContext(AbnLookupAuthenticationGuidContext)
}
