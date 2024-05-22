import * as React from 'react'
import { useJsApiLoader, Libraries } from '@react-google-maps/api'
import useGoogleMapsApiKey from './useGoogleMapsApiKey'

export default function useGoogle() {
  const key = useGoogleMapsApiKey()

  const libraries = React.useMemo<Libraries>(
    () => ['maps', 'marker', 'places'],
    [],
  )

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: key ?? '',
    libraries,
  })

  return { isLoaded }
}
