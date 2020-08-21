// @flow

import * as React from 'react'

type ExecutedLookupContextValue = {
  executedLookup: (LookupFormElement) => void,
  executeLookupFailed: (LookupFormElement) => void,
}

const ExecutedLookupContext = React.createContext<ExecutedLookupContextValue>({
  executedLookup: () => {},
  executeLookupFailed: () => {},
})

type Props = ExecutedLookupContextValue & {
  children: React.Node,
}

export const ExecutedLookupProvider = React.memo<Props>(
  function ExecutedLookupProvider({
    executedLookup,
    executeLookupFailed,
    children,
  }: Props) {
    const value = React.useMemo(
      () => ({
        executedLookup,
        executeLookupFailed,
      }),
      [executeLookupFailed, executedLookup],
    )
    return (
      <ExecutedLookupContext.Provider value={value}>
        {children}
      </ExecutedLookupContext.Provider>
    )
  },
)

export default function useExecutedLookupCallback() {
  return React.useContext(ExecutedLookupContext)
}
