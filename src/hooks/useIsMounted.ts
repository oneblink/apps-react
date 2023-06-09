import * as React from 'react'

/**
 * This function is a react hook for determining whether the consuming component
 * is currently mounted on the DOM.
 *
 * ## Example
 *
 * ```js
 * import { useIsMounted } from '@oneblink/apps-react'
 *
 * const isMounted = useIsMounted()
 *
 * if (isMounted.current) {
 *   // DO SOMETHING HERE
 * }
 * ```
 *
 * @returns
 * @group Hooks
 */
export default function useIsMounted(): {
  /** Whether the current component is mounted. */
  current: boolean
} {
  const isMounted = React.useRef(false)
  React.useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])
  return isMounted
}
