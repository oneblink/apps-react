import * as React from 'react'

export type LookupNotificationContextValue = {
  isLookup: boolean
  isDisabled: boolean
  isLoading: boolean
  allowLookupOnEmptyValue: boolean
  onLookup: (options: {
    newValue: unknown
    abortController: AbortController
    continueLookupOnAbort: boolean
  }) => Promise<void>
}

const defaultContext = {
  isLookup: false,
  isDisabled: false,
  isLoading: false,
  allowLookupOnEmptyValue: false,
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

  // We use a ref here to keep the abort controller outside of the useEffect
  // below. This way we can abort the lookup if the value changes while the
  // lookup is running.
  const abortControllerRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    if (lookupCount === 0) {
      return
    }
    abortControllerRef.current = new AbortController()
    onLookup({
      newValue: value,
      abortController: abortControllerRef.current,
      continueLookupOnAbort: false,
    })
    // Wants to use "onLookup" and "value" as dependencies,
    // however, these will change on any change made on any
    // element. Checking if "lookupCount" has changed is enough
    // to trigger a lookup when the correct dependencies change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupCount])

  React.useEffect(() => {
    const abortController = abortControllerRef.current
    if (abortController) {
      return () => {
        abortController.abort()
      }
    }
  }, [value, lookupCount])

  return {
    ...state,
    onLookup: React.useCallback(() => {
      setLookupCount((currentLookupCount) => currentLookupCount + 1)
    }, []),
  }
}
