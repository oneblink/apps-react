import * as React from 'react'

import { offlineService } from '@oneblink/apps'
import useBooleanState from '../hooks/useBooleanState'

const defaultValue = offlineService.isOffline()

const IsOfflineContext = React.createContext<boolean>(defaultValue)

/**
 * @param type
 * @param listener
 */
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

/**
 * IsOfflineContextProvider is a React Component that provides the `isOffline`
 * state for components further down your component tree to consume. It should
 * be used to wrap the components requiring the state.
 *
 * - **This component is required in your component tree to be able to consume the
 *   [`useIsOffline`](./useIsOffline.html) hook.**
 *
 * ### Usage
 *
 * ```jsx
 * import { IsOfflineContextProvider } from '@oneblink/apps-react'
 *
 * const TopLevelComponent = () => {
 *   return (
 *     <IsOfflineContextProvider>
 *       <div>
 *         <ComponentThatRequiresOfflineState />
 *       </div>
 *     </IsOfflineContextProvider>
 *   )
 * }
 *
 * export default TopLevelComponent
 * ```
 *
 * @param props
 * @returns
 */
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

/**
 * This function is a react hook for determining whether an application is in an
 * offline state.
 *
 * - **This component requires
 *   [`<IsOfflineContextProvider/>`](./IsOfflineContextProvider.html) to be
 *   present in your component tree.**
 *
 * ## Example
 *
 * ```js
 * import { useIsOffline } from '@oneblink/apps-react'
 *
 * const isOffline = useIsOffline()
 * ```
 */
export default function useIsOffline() {
  return React.useContext(IsOfflineContext)
}
