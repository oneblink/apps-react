import * as React from 'react'

type LookupNotificationContextValue = {
  isLookup: boolean
  isDisabled: boolean
  onLookup: (value: unknown, abortSignal: AbortSignal) => Promise<void>
}

const defaultContext = {
  isLookup: false,
  isDisabled: false,
  onLookup: async () => undefined,
}

export const LookupNotificationContext =
  React.createContext<LookupNotificationContextValue>(defaultContext)

export default function useLookupNotification(value: unknown) {
  const { onLookup, ...state } = React.useContext(LookupNotificationContext)

  // We use a number to trigger the lookup function so that we can have
  // the effect below run every time the onLookup function is called.
  // We need it in an useEffect so that we can pass an abort controller
  // and have it aborted if the user clicks the lookup button again.
  const [lookupCount, setLookupCount] = React.useState(0)

  React.useEffect(() => {
    if (lookupCount === 0) {
      return
    }
    const abortController = new AbortController()
    onLookup(value, abortController.signal)
    return () => {
      abortController.abort()
    }
    // Wants to use "onLookup" and "value" as dependencies,
    // however, these will change on any change made on any
    // element. Checking if "lookupCount" has changed is enough
    // to trigger a lookup when the correct dependencies change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupCount])

  return {
    ...state,
    onLookup: React.useCallback(() => {
      setLookupCount((currentLookupCount) => currentLookupCount + 1)
    }, []),
  }
}
