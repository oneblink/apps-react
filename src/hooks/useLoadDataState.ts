import * as React from 'react'
import useIsMounted from './useIsMounted'

export type LoadDataState<T> =
  | {
      status: 'SUCCESS'
      result: T
    }
  | {
      status: 'ERROR'
      error: Error
    }
  | {
      status: 'LOADING'
    }

export default function useLoadDataState<T>(
  onLoad: (abortSignal?: AbortSignal) => Promise<T>,
): [
  LoadDataState<T>,
  (abortSignal?: AbortSignal) => void,
  React.Dispatch<React.SetStateAction<T>>,
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
