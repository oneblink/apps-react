import { v4 as guid } from 'uuid'
import * as React from 'react'

const FlatpickrGuidContext = React.createContext<string>('')

type Props = {
  children: React.ReactNode
}
export const FlatpickrGuidProvider = ({ children }: Props) => {
  const value = React.useMemo(() => guid(), [])
  return (
    <FlatpickrGuidContext.Provider value={value}>
      <div id={value}>{children}</div>
    </FlatpickrGuidContext.Provider>
  )
}

export default function useFlatpickrGuidCallback() {
  return React.useContext(FlatpickrGuidContext)
}
