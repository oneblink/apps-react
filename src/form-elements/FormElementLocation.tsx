import * as React from 'react'
import useBooleanState from '../hooks/useBooleanState'
import useIsOffline from '../hooks/useIsOffline'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import geolocation from '@blinkmobile/geolocation'
import queryString from 'query-string'
import OnLoading from '../components/OnLoading'
import defaultCoords from '../services/defaultCoordinates'
import useGoogleMapsApiKeyKey from '../hooks/useGoogleMapsApiKey'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import { Sentry } from '@oneblink/apps'
import { FormElementValueChangeHandler } from '../types/form'

type Props = {
  id: string
  element: FormTypes.LocationElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<Coords>
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

type Coords = {
  latitude: number
  longitude: number
  zoom?: number
}

export const stringifyLocation = (location: Coords | undefined) => {
  if (location) {
    return `${location.latitude},${location.longitude}`
  }
}

function parseLocationValue(value: unknown): Coords | undefined {
  if (!value || typeof value !== 'object') {
    return
  }

  const { latitude, longitude, zoom } = value as Record<string, unknown>
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return
  }

  return {
    latitude,
    longitude,
    zoom: typeof zoom === 'number' ? zoom : initialMapZoom,
  }
}

const mapHeight = 300
const initialMapZoom = 15
const apiUrl = 'https://maps.googleapis.com/maps/api/staticmap'
function FormElementLocation({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [isDirty, setIsDirty] = useBooleanState(false)
  const [isLocationPickerOpen, showLocationPicker, hideLocationPicker] =
    useBooleanState(false)

  const [location, setLocation] = React.useState<Coords | undefined>(undefined)
  const onClear = React.useCallback(() => {
    hideLocationPicker()
    onChange(element, undefined)
    setLocation(undefined)
  }, [element, hideLocationPicker, onChange])

  const onCancel = React.useCallback(() => {
    hideLocationPicker()
    setLocation(parseLocationValue(value))
  }, [hideLocationPicker, value])

  const onLocate = React.useCallback(async () => {
    showLocationPicker()

    if (location) {
      return
    }

    let currentLocation = null
    try {
      const result = await geolocation.getCurrentPosition()
      currentLocation = result.coords
    } catch (err) {
      console.error(
        'Error while attempting to find the users current location',
        err,
      )
      Sentry.captureException(err)
    } finally {
      setLocation(parseLocationValue(currentLocation || defaultCoords()))
    }
  }, [location, showLocationPicker])

  const isLoadingLocation = !location && isLocationPickerOpen

  const onConfirm = React.useCallback(() => {
    setIsDirty()
    hideLocationPicker()
    onChange(element, location)
  }, [element, hideLocationPicker, location, onChange, setIsDirty])

  // SET DEFAULT/PREFILL DATA
  React.useEffect(() => {
    const newValue = parseLocationValue(value)
    if (newValue) {
      setLocation(newValue)
    }
  }, [value])

  return (
    <div className="cypress-location-element">
      <FormElementLabelContainer
        className="ob-location"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="control">
          <LocationDisplay
            isOpen={isLocationPickerOpen}
            isLoading={isLoadingLocation}
            location={location}
            onChange={setLocation}
          />

          <div className="buttons ob-buttons ob-location__buttons">
            {isLocationPickerOpen ? (
              <>
                <button
                  type="button"
                  className="is-light button ob-button ob-button__cancel ob-location__button ob-location__button-cancel cypress-cancel-location-button"
                  onClick={onCancel}
                  disabled={element.readOnly}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="is-primary button ob-button ob-button__confirm ob-location__button ob-location__button-confirm cypress-confirm-location-button"
                  onClick={onConfirm}
                  disabled={element.readOnly || !location}
                >
                  Confirm
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="is-light button ob-button ob-button__clear ob-button-clear ob-location__button ob-location__button-clear cypress-clear-location-button"
                  onClick={onClear}
                  disabled={element.readOnly}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="is-primary button ob-button ob-button__edit ob-location__button ob-location__button-edit cypress-locate-button"
                  onClick={onLocate}
                  disabled={element.readOnly}
                >
                  Locate
                </button>
              </>
            )}
          </div>
        </div>

        {(isDirty || displayValidationMessage) && !!validationMessage && (
          <div role="alert" className="has-margin-top-8">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

const LocationDisplay = React.memo(function LocationDisplay({
  isLoading,
  isOpen,
  location,
  onChange,
}: {
  isLoading: boolean
  isOpen: boolean
  location: Coords | undefined
  onChange: (location: Coords) => void
}) {
  const isOffline = useIsOffline()

  if (isLoading) {
    return (
      <figure className="ob-figure">
        <div className="figure-content">
          <OnLoading small></OnLoading>
        </div>
      </figure>
    )
  }

  if (isOffline) {
    return <LocationIsOffline location={location} isOpen={isOpen} />
  }

  if (isOpen) {
    if (!location) {
      // There is no location to display while user is attempting to pick a location.
      // This should never happen, if loading has finished a default should be set.
      // Fail fast!!!
      // https://en.wikipedia.org/wiki/Fail-fast
      throw new Error(
        'Default location was not set for "location" form element',
      )
    }

    return <LocationPicker location={location} onChange={onChange} />
  }

  if (location) {
    return <LocationImage location={location} />
  }

  return null
})

function LocationIsOfflineFigureContent({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <figure className="ob-figure">
      <div className="figure-content has-text-centered">
        <h4 className="title is-4">You are currently offline</h4>
        {children}
      </div>
    </figure>
  )
}

const LocationIsOffline = React.memo(function LocationIsOffline({
  location,
  isOpen,
}: {
  location: Coords | undefined
  isOpen: boolean
}) {
  if (isOpen) {
    if (location) {
      // If user is offline and attempting to pick a location and there is one set already
      return (
        <LocationIsOfflineFigureContent>
          <p>
            Click the <b>Confirm</b> button below to set the location to your
            current position.
          </p>
        </LocationIsOfflineFigureContent>
      )
    }

    // If user is offline and attempting to pick a location and there is one nothing set yet
    return (
      <LocationIsOfflineFigureContent>
        <p>
          We could not find your current location. Click the <b>Cancel</b>{' '}
          button below to try again.
        </p>
      </LocationIsOfflineFigureContent>
    )
  }

  // If user is offline and has confirmed a location
  if (location) {
    return (
      <LocationIsOfflineFigureContent>
        <h3 className="title is-3 ob-location__latitude">Latitude</h3>
        <p>
          <b>{location.latitude}</b>
        </p>
        <h3 className="title is-3 ob-location__longitude">Longitude</h3>
        <p>
          <b>{location.longitude}</b>
        </p>
      </LocationIsOfflineFigureContent>
    )
  }

  // User is offline with no location set and not attempting to pick a location
  return null
})

const LocationImage = React.memo(function LocationImage({
  location,
}: {
  location: Coords
}) {
  const googleMapsApiKey = useGoogleMapsApiKeyKey()

  const staticUrl = React.useMemo(() => {
    const center = `${location.latitude},${location.longitude}`
    const queries = {
      key: googleMapsApiKey,
      size: `${mapHeight}x${mapHeight}`,
      zoom: location.zoom,
      center,
      markers: `color:red|${center}`,
    }
    return `${apiUrl}?${queryString.stringify(queries)}`
  }, [googleMapsApiKey, location])

  return (
    <figure className="ob-figure">
      <img
        className="ob-location__map"
        alt={`map with center at ${location.latitude} latitude, ${location.longitude} longitude`}
        src={staticUrl}
        height={mapHeight}
        width={mapHeight}
      />
    </figure>
  )
})

const LocationPicker = React.memo(function SummaryResult({
  location,
  onChange,
}: {
  location: Coords
  onChange: (newLocation: Coords) => void
}) {
  const googleMapsApiKey = useGoogleMapsApiKeyKey()

  const [map, setMap] = React.useState<google.maps.Map | null>(null)

  const center = React.useMemo(() => {
    return {
      lat: location.latitude,
      lng: location.longitude,
    }
  }, [location.latitude, location.longitude])

  const onZoomChanged = React.useCallback(() => {
    if (!map) {
      return
    }

    onChange({
      latitude: location.latitude,
      longitude: location.longitude,
      zoom: map.getZoom(),
    })
  }, [location.latitude, location.longitude, map, onChange])

  return (
    <figure className="ob-figure">
      <LoadScript googleMapsApiKey={googleMapsApiKey || ''}>
        <GoogleMap
          onLoad={(map) => setMap(map)}
          onUnmount={() => setMap(null)}
          mapContainerStyle={{
            height: 300,
          }}
          center={center}
          zoom={location.zoom}
          onZoomChanged={onZoomChanged}
        >
          <Marker
            animation={2} // DOCUMENTATION IS POOR, THIS IS DROP ANIMATION
            position={center}
            draggable
            onDragEnd={(e) => {
              if (!e.latLng) {
                return
              }
              const { lat, lng } = e.latLng.toJSON()
              onChange({
                latitude: lat,
                longitude: lng,
                zoom: location.zoom,
              })
            }}
          ></Marker>
        </GoogleMap>
      </LoadScript>
    </figure>
  )
})

export default React.memo(FormElementLocation)
