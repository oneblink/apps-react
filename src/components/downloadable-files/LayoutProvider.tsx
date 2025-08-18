import * as React from 'react'

export type LayoutType = 'GRID' | 'LIST'

const LayoutContext = React.createContext<LayoutType>('GRID')

export const LayoutProvider = ({
  children,
  layout,
}: {
  children: React.ReactNode
  layout: LayoutType
}) => {
  return (
    <LayoutContext.Provider value={layout}>{children}</LayoutContext.Provider>
  )
}

export const useLayout = () => {
  return React.useContext(LayoutContext)
}
