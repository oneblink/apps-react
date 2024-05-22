import * as React from 'react'

export const GoogleMapsApiKeyContext = React.createContext<string | undefined>(
  undefined,
)

export default function useGoogleMapsApiKey() {
  return React.useContext(GoogleMapsApiKeyContext)
}
