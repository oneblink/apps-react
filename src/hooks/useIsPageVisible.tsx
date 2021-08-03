import * as React from 'react'

type IsPageVisibleContextValue = boolean

type Props = {
  isPageVisible: IsPageVisibleContextValue
  children: React.ReactNode
}

const IsPageVisibleContext =
  React.createContext<IsPageVisibleContextValue>(false)

export function IsPageVisibleProvider({ isPageVisible, children }: Props) {
  return (
    <IsPageVisibleContext.Provider value={isPageVisible}>
      {children}
    </IsPageVisibleContext.Provider>
  )
}

export default function useIsPageVisible() {
  return React.useContext(IsPageVisibleContext)
}
