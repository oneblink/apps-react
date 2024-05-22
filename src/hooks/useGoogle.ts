import { useJsApiLoader } from '@react-google-maps/api'
import useGoogleMapsApiKey from './useGoogleMapsApiKey'

export default function useGoogle() {
  const key = useGoogleMapsApiKey()

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: key ?? '',
    libraries: ['maps', 'marker', 'places'],
  })

  return { isLoaded }
}
