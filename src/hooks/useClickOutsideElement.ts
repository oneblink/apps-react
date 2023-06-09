import * as React from 'react'

/**
 * This function is a react hook for watching for click events outside of a
 * particular element. The hook will add and remove its own `eventListener`.
 *
 * - For performance reasons, it is important to pass a memoised function as the
 *   callback argument, eg:
 *
 * ```js
 * React.useCallback(() => {}, [])
 * ```
 *
 * ## Example
 *
 * ```js
 * import * as React from 'react'
 * import { useClickOutsideElement } from '@oneblink/apps-react'
 *
 * const MyComponent = () => {
 *   const narrowDivRef = React.useRef(null)
 *   useClickOutsideElement(
 *     narrowDivRef,
 *     React.useCallback(() => {
 *       console.log('Wide Div was clicked outside of narrow div...')
 *     }, []),
 *   )
 *
 *   return (
 *     <div className="wide-div">
 *       <div ref={narrowDivRef} className="narrow-div"></div>
 *     </div>
 *   )
 * }
 *
 * export default MyComponent
 * ```
 *
 * @param ref
 * @param callback
 * @group Hooks
 */
export default function useClickOutsideElement(
  ref: { current: HTMLElement | null },
  callback: () => void,
) {
  const handleClickOutside = React.useCallback(
    (event: Event) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    },
    [callback, ref],
  )
  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClickOutside])
}
