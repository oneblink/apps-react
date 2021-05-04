import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import useBooleanState from '../hooks/useBooleanState'
const useToggleComplianceChildren = (
  element: FormTypes.ComplianceElement,
  initialState: boolean,
  onToggleOff: (
    element: FormTypes.ComplianceElement,
    newValue: undefined,
  ) => void,
): [isShowing: boolean, handleToggle: () => void] => {
  const [isShowing, , , toggleIsShowing] = useBooleanState(initialState)

  const handleToggle = React.useCallback(() => {
    if (isShowing) {
      onToggleOff(element, undefined)
    }
    toggleIsShowing()
  }, [element, isShowing, onToggleOff, toggleIsShowing])

  return [isShowing, handleToggle]
}

export default useToggleComplianceChildren
