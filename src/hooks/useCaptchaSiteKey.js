// @flow

import * as React from 'react'

export const CaptchaSiteKeyContext /* : React.Context<string | void> */ = React.createContext()

export default function useCaptchaSiteKey() {
  return React.useContext(CaptchaSiteKeyContext)
}
