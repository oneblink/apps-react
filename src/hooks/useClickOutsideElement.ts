import * as React from 'react'

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
