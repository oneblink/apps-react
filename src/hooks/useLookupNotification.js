// @flow

import * as React from 'react'

type LookupNotificationContextValue = {
  isLookup: boolean,
  isDisabled: boolean,
  onLookup: () => mixed,
}

const defaultContext = {
  isLookup: false,
  isDisabled: false,
  onLookup: () => {},
}

export const LookupNotificationContext = React.createContext<LookupNotificationContextValue>(
  defaultContext,
)

export default function useLookupNotification() {
  return React.useContext(LookupNotificationContext)
}
