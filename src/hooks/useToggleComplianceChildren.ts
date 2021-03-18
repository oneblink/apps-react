import * as React from 'react'
import useBooleanState from '../hooks/useBooleanState'
const useToggleComplianceChildren = (
  onToggleOff: (newValue: undefined) => void,
): [isShowing: boolean, handleToggle: () => void] => {
  const [isShowing, , , toggleIsShowing] = useBooleanState(false)

  const handleToggle = React.useCallback(() => {
    if (!isShowing) {
      onToggleOff(undefined)
    }
    toggleIsShowing()
  }, [isShowing, onToggleOff, toggleIsShowing])

  return [isShowing, handleToggle]
}

export default useToggleComplianceChildren
