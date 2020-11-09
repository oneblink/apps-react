import * as React from 'react'

export default function useChangeEffect(
  effect: () => void | (() => void),
  dependencies: unknown[],
) {
  const initializeRef = React.useRef(false)

  React.useEffect(() => {
    if (initializeRef.current) {
      return effect()
    } else {
      initializeRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencies])
}
