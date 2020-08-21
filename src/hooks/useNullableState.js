// @flow

import * as React from 'react'

export default function useNullableState /* :: <T> */(
  defaultValue /* : T | null */,
) /*: [T | null, (T) => void, () => void] */ {
  const [state, setState] = React.useState(defaultValue)
  const unsetState = React.useCallback(() => setState(null), [])
  return [state, setState, unsetState]
}
