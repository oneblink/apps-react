import * as React from 'react'
import { useJsApiLoader, Libraries } from '@react-google-maps/api'

/**
 * Load the google maps JavaScript API libraries used by this package.
 *
 * @param key Google Maps API Key
 * @returns
 */
export default function useGoogleJsApiLoader(key: string) {
  const libraries = React.useMemo<Libraries>(
    () => ['maps', 'marker', 'places'],
    [],
  )

  return useJsApiLoader({
    googleMapsApiKey: key,
    libraries,
  })
}
