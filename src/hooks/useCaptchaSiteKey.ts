import * as React from 'react'

export const CaptchaSiteKeyContext =
  React.createContext<string | undefined>(undefined)

export default function useCaptchaSiteKey() {
  return React.useContext(CaptchaSiteKeyContext)
}
