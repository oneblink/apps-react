import useGoogleMapsApiKey from './useGoogleMapsApiKey'
import useGoogleJsApiLoader from './useGoogleJsApiLoader'

export default function useGoogle() {
  const key = useGoogleMapsApiKey()

  return useGoogleJsApiLoader(key ?? '')
}
