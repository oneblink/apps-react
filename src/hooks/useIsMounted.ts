import * as React from 'react'

export default function useIsMounted(): { current: boolean } {
  const isMounted = React.useRef(false)
  React.useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])
  return isMounted
}
