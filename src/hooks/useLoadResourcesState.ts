import * as React from 'react'
import useLoadDataState from './useLoadDataState'

/**
 * This function is a react hook for managing the state involved with loading
 * resources.
 *
 * ## Example
 *
 * ```js
 * import { useLoadResourcesState } from '@oneblink/apps-react'
 * const fetchResources = async () => {
 *   const response = await fetch(`https://some-website.com/api?data=data`)
 *
 *   if (!response.ok) {
 *     const text = await response.text()
 *     throw new Error(text)
 *   }
 *
 *   return await response.json()
 * }
 *
 * const MyComponent = () => {
 *   const [resources, isLoading, loadError, refresh, setResult] =
 *     useLoadResourcesState(fetchResources)
 *
 *   if (isLoading) {
 *     return <Loading />
 *   }
 *
 *   if (loadError) {
 *     return (
 *       <>
 *         <Error message={state.error} />
 *         <button onClick={refresh}>Try Again</button>
 *       </>
 *     )
 *   }
 *
 *   return (
 *     <>
 *       {resources.map((resource) => {
 *         // RENDER UI
 *         return <></>
 *       })}
 *     </>
 *   )
 * }
 *
 * export default MyComponent
 * ```
 *
 * @param onLoad The function that fetches your resources. Should be a Promise
 *   that returns your array of resources
 * @returns
 */
export default function useLoadResourcesState<T>(
  onLoad: (abortSignal: AbortSignal) => Promise<T[]>,
): [
  resources: T[],
  isLoading: boolean,
  loadError: Error | null,
  handleRefresh: () => void,
  setResult: React.Dispatch<React.SetStateAction<T[]>>,
] {
  const emptyResources = React.useMemo<T[]>(() => [], [])
  const [state, ...rest] = useLoadDataState(onLoad)
  return [
    state.status === 'SUCCESS' ? state.result : emptyResources,
    state.status === 'LOADING',
    state.status === 'ERROR' ? state.error : null,
    ...rest,
  ]
}
