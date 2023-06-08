import * as React from 'react'
import useIsMounted from './useIsMounted'

export type LoadDataState<T> =
  | {
      status: 'SUCCESS'
      /** Your data. */
      result: T
    }
  | {
      status: 'ERROR'
      /** A JavaScript `Error` object. */
      error: Error
    }
  | {
      status: 'LOADING'
    }

/**
 * This function is a react hook for managing the state involved with loading
 * data.
 *
 * ## Example
 *
 * ```js
 * import { useLoadDataState } from '@oneblink/apps-react'
 * const fetchData = async () => {
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
 *   const [state, refresh, setResult] = useLoadDataState(fetchData)
 *
 *   switch (state.status) {
 *     case 'LOADING':
 *       return <Loading />
 *     case 'ERROR':
 *       return <Error message={state.error} />
 *     case 'SUCCESS':
 *     // RENDER UI
 *   }
 * }
 *
 * export default MyComponent
 * ```
 *
 * @param onLoad The function that fetches your data. Should be a Promise that
 *   returns your data
 * @returns
 */
export default function useLoadDataState<T>(
  onLoad: (abortSignal?: AbortSignal) => Promise<T>,
): [
  state: LoadDataState<T>,
  handleLoad: (abortSignal?: AbortSignal) => void,
  setResult: React.Dispatch<React.SetStateAction<T>>,
] {
  const isMounted = useIsMounted()
  const [state, setState] = React.useState<LoadDataState<T>>({
    status: 'LOADING',
  })

  const handleLoad = React.useCallback(
    async (abortSignal?: AbortSignal) => {
      setState({
        status: 'LOADING',
      })
      try {
        const result = await onLoad(abortSignal)
        if (isMounted.current && !abortSignal?.aborted) {
          setState({
            status: 'SUCCESS',
            result,
          })
        }
      } catch (err) {
        if (isMounted.current && !abortSignal?.aborted) {
          setState({
            status: 'ERROR',
            error: err as Error,
          })
        }
      }
    },
    [isMounted, onLoad],
  )

  const setResult: React.Dispatch<React.SetStateAction<T>> = React.useCallback(
    (setter) => {
      setState((currentState: LoadDataState<T>) => {
        if (currentState.status === 'SUCCESS') {
          return {
            ...currentState,
            result:
              typeof setter === 'function'
                ? // @ts-expect-error Typescript cannot tell between a generic type (T) and a function
                  setter(currentState.result)
                : setter,
          }
        } else {
          return currentState
        }
      })
    },
    [],
  )

  React.useEffect(() => {
    const abortController = new AbortController()
    handleLoad(abortController.signal)
    return () => {
      abortController.abort()
    }
  }, [handleLoad])

  return [state, handleLoad, setResult]
}
