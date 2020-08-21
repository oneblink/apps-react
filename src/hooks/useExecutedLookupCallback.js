// @flow

import * as React from 'react'

/* ::
type ExecutedLookupContextValue = {
  executedLookup: (LookupFormElement) => void,
  executeLookupFailed: (LookupFormElement) => void,
}

type Props = ExecutedLookupContextValue & {
  children: React.Node,
}
*/

const ExecutedLookupContext /* : React.Context<ExecutedLookupContextValue> */ = React.createContext(
  {
    executedLookup: () => {},
    executeLookupFailed: () => {},
  },
)

export const ExecutedLookupProvider /* : React.AbstractComponent<Props> */ = React.memo(
  function ExecutedLookupProvider(
    { executedLookup, executeLookupFailed, children } /* : Props */,
  ) {
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
