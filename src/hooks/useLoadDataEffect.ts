import * as React from 'react'

/**
 * This function is a react hook for loading data and reloading it with a way of
 * aborting the request. Useful when using reducers to load data asynchronously
 * and store the state outside of this react hook.
 *
 * ## Example
 *
 * ```js
 * import { useLoadDataEffect } from '@oneblink/apps-react'
 *
 * const fetchData = async (abortSignal) => {
 *   const response = await fetch(
 *     `https://some-website.com/api?data=data`,
 *     {
 *       signal: abortSignal,
 *     },
 *   )
 *
 *   const data = await response.json()
 *   // store data in a data layer for later use
 * }
 *
 * export default function MyComponent() {
 *   const handleRefresh = useLoadDataEffect(fetchData)
 *
 *   return <button onClick={handleRefresh}>Refresh</button>
 * }
 * ```
 *
 * @param onLoad The function that fetches your data and stores it for later
 *   use.
 * @returns A function to reload the data
 * @group Hooks
 */
export default function useLoadDataEffect(
  onLoad: (abortSignal: AbortSignal) => void,
): () => void {
  // We use a number to trigger the refresh function so that
  // we can pass an abort controller using a useEffect and
  // have it aborted if the refresh function is triggered again.
  const [loadCount, setLoadCount] = React.useState(0)

  const handleReload = React.useCallback(() => {
    setLoadCount((currentLoadCount) => currentLoadCount + 1)
  }, [])

  React.useEffect(() => {
    const abortController = new AbortController()
    onLoad(abortController.signal)
    return () => {
      abortController.abort()
    }
  }, [loadCount, onLoad])

  return handleReload
}
