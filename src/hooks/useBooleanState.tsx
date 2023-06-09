import * as React from 'react'

/**
 * This function is a react hook for boolean state that comes with
 * `useCallback`s for 'turning on', 'turning off' and toggling the state.
 *
 * ## Return
 *
 * The return type of `useBooleanState(true)` is an array where:
 *
 * - The first item is a `boolean` (the state).
 * - The second item is `() => void` (a function that sets the state to true).
 * - The third item is `() => void` (a function that sets the state to false).
 * - The fourth item is `() => void` (a function that toggles the state to the
 *   opposite of what it currently is).
 *
 * As such, the items in the array can be destructured and named whatever you
 * like:
 *
 * ```js
 * import { useBooleanState } from '@oneblink/apps-react'
 *
 * const [dialogIsOpen, openDialog, closeDialog, toggleDialog] =
 *   useBooleanState(true)
 * ```
 *
 * These properties can then be used like:
 *
 * ```js
 * openDialog()
 * closeDialog()
 * toggleDialog()
 * ```
 *
 * @param defaultValue
 * @returns
 * @group Hooks
 */
export default function useBooleanState(
  defaultValue: boolean,
): [
  state: boolean,
  setTrue: () => void,
  setFalse: () => void,
  toggle: () => void,
] {
  const [state, setState] = React.useState(defaultValue)
  const turnOn = React.useCallback(() => setState(true), [])
  const turnOff = React.useCallback(() => setState(false), [])
  const toggle = React.useCallback(() => setState((current) => !current), [])
  return [state, turnOn, turnOff, toggle]
}
