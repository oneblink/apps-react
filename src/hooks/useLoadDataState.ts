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
): [LoadDataState<T>, () => void] {
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
          error: err,
        })
      }
    }
  }, [isMounted, onLoad])

  React.useEffect(() => {
    handleLoad()
  }, [handleLoad])

  return [state, handleLoad]
}
