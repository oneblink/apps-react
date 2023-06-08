import * as React from 'react'

/**
 * This function is a react hook for state of type of your choosing. It comes
 * with two memoized functions, one for setting state and one for clearing it.
 *
 * The items returned in the array can be destructured and named whatever you
 * like:
 *
 * ```js
 * import { useNullableState } from '@oneblink/apps-react'
 *
 * const startingProfile = {
 *   name: 'Forest Gump',
 *   profession: 'Military, Athlete, Other',
 * }
 *
 * const [userProfile, setUserProfile, unsetUserProfile] =
 *   useBooleanState(startingProfile)
 * ```
 *
 * `setUserProfile` can then be called with an object of type `T` like:
 *
 * ```js
 * setUserProfile({
 *   name: 'Walter White',
 *   profession: 'Chemistry Teacher (Secondary School), Other',
 * })
 * ```
 *
 * And `unsetUserProfile` can be called like:
 *
 * ```js
 * unsetUserProfile()
 * ```
 *
 * @param defaultValue
 * @returns
 */
export default function useNullableState<T>(
  /** The starting state for the hook. */
  defaultValue: T | null,
): [
  state: T | null,
  setState: React.Dispatch<React.SetStateAction<T | null>>,
  clearState: () => void,
] {
  const [state, setState] = React.useState(defaultValue)
  const unsetState = React.useCallback(() => setState(null), [])
  return [state, setState, unsetState]
}
