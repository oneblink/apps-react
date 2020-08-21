// @flow

import * as React from 'react'

type setTrue = () => void
type setFalse = () => void
type toggle = () => void

export default function useBooleanState(
  defaultValue: boolean
): [boolean, setTrue, setFalse, toggle] {
  const [state, setState] = React.useState(defaultValue)
  const turnOn = React.useCallback(() => setState(true), [])
  const turnOff = React.useCallback(() => setState(false), [])
  const toggle = React.useCallback(() => setState((current) => !current), [])
  return [state, turnOn, turnOff, toggle]
}
