import * as React from 'react'

export const GoogleMapsApiKeyContext =
  React.createContext<string | undefined>(undefined)

export default function useGoogleMapsApiKeyKey() {
  return React.useContext(GoogleMapsApiKeyContext)
}
