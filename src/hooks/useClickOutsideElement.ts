import * as React from 'react'

export default function useClickOutsideElement(
  ref: { current: HTMLElement | null },
  callback: () => void,
) {
  const handleClickOutside = React.useCallback(
    (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
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
