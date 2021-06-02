import * as React from 'react'

type LookupNotificationContextValue = {
  isLookup: boolean
  isDisabled: boolean
  onLookup: (value: unknown) => Promise<void>
}

const defaultContext = {
  isLookup: false,
  isDisabled: false,
  onLookup: async () => {},
}

export const LookupNotificationContext =
  React.createContext<LookupNotificationContextValue>(defaultContext)

export default function useLookupNotification() {
  return React.useContext(LookupNotificationContext)
}
