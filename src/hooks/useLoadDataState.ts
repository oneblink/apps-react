import * as React from 'react'
import useIsMounted from './useIsMounted'

type LoadDataState<T> =
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
  onLoad: () => Promise<T>,
): [LoadDataState<T>, () => void, React.Dispatch<React.SetStateAction<T>>] {
  const isMounted = useIsMounted()
  const [state, setState] = React.useState<LoadDataState<T>>({
    status: 'LOADING',
  })

  const handleLoad = React.useCallback(async () => {
    setState({
      status: 'LOADING',
    })
    try {
      const result = await onLoad()
      if (isMounted.current) {
        setState({
          status: 'SUCCESS',
          result,
        })
      }
    } catch (err) {
      if (isMounted.current) {
        setState({
          status: 'ERROR',
          error: err as Error,
        })
      }
    }
  }, [isMounted, onLoad])

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
    handleLoad()
  }, [handleLoad])

  return [state, handleLoad, setResult]
}
