import * as React from 'react'
import useBooleanState from '../hooks/useBooleanState'
const useToggleComplianceChildren = (
  initialState: boolean,
  onToggleOff: (newValue: undefined) => void,
): [isShowing: boolean, handleToggle: () => void] => {
  const [isShowing, , , toggleIsShowing] = useBooleanState(initialState)

  const handleToggle = React.useCallback(() => {
    if (isShowing) {
      onToggleOff(undefined)
    }
    toggleIsShowing()
  }, [isShowing, onToggleOff, toggleIsShowing])

  return [isShowing, handleToggle]
}

export default useToggleComplianceChildren
