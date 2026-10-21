import * as React from 'react'
import replaceEqualDeep from '../utils/replaceEqualDeep'

/**
 * Returns a value deeply equal to `value` that reuses object instances from the
 * previously returned value wherever they are deeply equal.
 */
export default function useStructuralSharing<T>(value: T): T {
  const [state, setState] = React.useState({ value, sharedValue: value })
  if (state.value === value) {
    return state.sharedValue
  }
  const sharedValue = replaceEqualDeep(state.sharedValue, value)
  setState({ value, sharedValue })
  return sharedValue
}
