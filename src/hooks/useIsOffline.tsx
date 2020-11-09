import * as React from 'react'

import { offlineService } from '@oneblink/apps'
import useBooleanState from '../hooks/useBooleanState'

const defaultValue = offlineService.isOffline()

const IsOfflineContext = React.createContext<boolean>(defaultValue)

export const useNetworkChangeEffect = (
  type: 'online' | 'offline',
  listener: () => unknown,
) => {
  React.useEffect(() => {
    // Stupid cordova seems to require that offline/online
    // listeners are set on the document and browsers seem
    // to require window.
    const element = window.cordova ? document : window
    element.addEventListener(type, listener)

    return () => {
      element.removeEventListener(type, listener)
    }
  }, [type, listener])
}

export function IsOfflineContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOffline, goOffline, goOnline] = useBooleanState(defaultValue)

  useNetworkChangeEffect('online', goOnline)
  useNetworkChangeEffect('offline', goOffline)

  return (
    <IsOfflineContext.Provider value={isOffline}>
      {children}
    </IsOfflineContext.Provider>
  )
}

export default function useIsOffline() {
  return React.useContext(IsOfflineContext)
}
