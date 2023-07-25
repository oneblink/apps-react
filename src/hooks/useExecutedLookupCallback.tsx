import { FormTypes } from '@oneblink/types'
import * as React from 'react'

type ExecutedLookupContextValue = {
  executedLookup: (lookupFormElement: FormTypes.LookupFormElement) => void
  removeExecutedLookup: (lookupFormElement: FormTypes.LookupFormElement) => void
}

type Props = ExecutedLookupContextValue & {
  children: React.ReactNode
}

const ExecutedLookupContext = React.createContext<ExecutedLookupContextValue>({
  executedLookup: () => {},
  removeExecutedLookup: () => {},
})

export const ExecutedLookupProvider = React.memo<Props>(
  function ExecutedLookupProvider({
    executedLookup,
    removeExecutedLookup,
    children,
  }: Props) {
    const value = React.useMemo(
      () => ({
        executedLookup,
        removeExecutedLookup,
      }),
      [removeExecutedLookup, executedLookup],
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
