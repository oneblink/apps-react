// @flow

import * as React from 'react'

export const GoogleMapsApiKeyContext /* : React.Context<string | void> */ = React.createContext()

export default function useGoogleMapsApiKeyKey() {
  return React.useContext(GoogleMapsApiKeyContext)
}
