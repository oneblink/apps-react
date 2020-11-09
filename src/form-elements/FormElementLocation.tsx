import * as React from 'react'
import clsx from 'clsx'
import useBooleanState from '../hooks/useBooleanState'
import useIsOffline from '../hooks/useIsOffline'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import geolocation from '@blinkmobile/geolocation'
import queryString from 'query-string'
import OnLoading from '../components/OnLoading'
import defaultCoords from '../services/defaultCoordinates'
import useGoogleMapsApiKeyKey from '../hooks/useGoogleMapsApiKey'
import { FormTypes } from '@oneblink/types'

type Props = {
  id: string
  element: FormTypes.LocationElement
  value: unknown | undefined
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: unknown | undefined,
  ) => unknown
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

type Coords = {
  latitude: number
  longitude: number
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
  const isOffline = useIsOffline()
  const [isDirty, setIsDirty] = useBooleanState(false)
  const [
    isLoadingLocation,
    setIsLoadingLocation,
    setIsNotLoadingLocation,
  ] = useBooleanState(false)
  const [
    locationPickerIsOpen,
    showLocationPicker,
    hideLocationPicker,
  ] = useBooleanState(false)

  const setCurrentLocation = React.useCallback(async () => {
    const { coords } = await geolocation.getCurrentPosition()
    if (coords) {
      const { latitude = 0, longitude = 0 } = coords
      setLocation({ latitude, longitude })
    }
  }, [])
  const [location, setLocation] = React.useState<Coords | undefined>(undefined)
  const onClear = React.useCallback(() => {
    hideLocationPicker()
    onChange(element, undefined)
    setLocation(undefined)
  }, [element, hideLocationPicker, onChange])

  const onCancel = React.useCallback(() => {
    hideLocationPicker()
    setLocation(value as Coords | undefined)
  }, [hideLocationPicker, value])

  const onLocate = React.useCallback(async () => {
    setIsLoadingLocation()
    try {
      if (!location) {
        await setCurrentLocation()
      }
    } catch (err) {
      console.error(err)
      setLocation(defaultCoords())
    }
    showLocationPicker()
    setIsNotLoadingLocation()
  }, [
    location,
    setCurrentLocation,
    showLocationPicker,
    setIsLoadingLocation,
    setIsNotLoadingLocation,
  ])

  const onConfirm = React.useCallback(() => {
    setIsDirty()
    hideLocationPicker()
    onChange(element, location)
  }, [element, hideLocationPicker, location, onChange, setIsDirty])

  // SET DEFAULT/PREFILL DATA
  React.useEffect(() => {
    if (value) {
      setLocation(value as Coords | undefined)
    }
  }, [value])
  return (
    <div className="cypress-location-element">
      <div className="ob-form__element ob-location">
        <label
          className={clsx('label ob-label', {
            'is-required': element.required,
          })}
          htmlFor={id}
        >
          {element.label}
        </label>
        <div className="control">
          {!isOffline ? (
            <LocationPicker
              isOpen={locationPickerIsOpen}
              value={location}
              onChange={setLocation}
            ></LocationPicker>
          ) : (
            <LocationIsOffline
              isOpen={locationPickerIsOpen}
              location={location}
            ></LocationIsOffline>
          )}
          {isLoadingLocation && <OnLoading small></OnLoading>}

          <div className="buttons ob-buttons ob-location__buttons">
            {locationPickerIsOpen ? (
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
          <div role="alert">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const LocationIsOffline = React.memo(function LocationIsOffline({
  location,
  isOpen,
}: {
  location: Coords | undefined
  isOpen: boolean
}) {
  return (
    <div>
      {isOpen ? (
        <figure>
          <div className="figure-content has-text-centered">
            <h4 className="title is-4">You are currently offline</h4>
            {location ? (
              <p>
                Click the <b>Confirm</b> button below to set the location to
                your current position.
              </p>
            ) : (
              <p>
                We could not find your current location. Click the <b>Cancel</b>{' '}
                button below to try again.
              </p>
            )}
          </div>
        </figure>
      ) : location ? (
        <figure>
          <div className="figure-content has-text-centered">
            <h4 className="title is-4">You are currently offline</h4>
            <h3 className="title is-3 ob-location__latitude">Latitude</h3>
            <p>
              <b>{location.latitude}</b>
            </p>
            <h3 className="title is-3 ob-location__longitude">Longitude</h3>
            <p>
              <b>{location.longitude}</b>
            </p>
          </div>
        </figure>
      ) : null}
    </div>
  )
})

const LocationPicker = React.memo(function SummaryResult({
  value,
  isOpen,
  onChange,
}: {
  value: Coords | undefined
  isOpen: boolean
  onChange: (newValue: Coords) => void
}) {
  const googleMapsApiKey = useGoogleMapsApiKeyKey()

  const coords = React.useMemo(
    () =>
      value &&
      typeof value === 'object' &&
      typeof value.latitude === 'number' &&
      typeof value.longitude === 'number'
        ? {
            lat: value.latitude,
            lng: value.longitude,
          }
        : undefined,
    [value],
  )

  const [map, setMap] = React.useState(null)
  const [zoom, setZoom] = React.useState<number>(initialMapZoom)
  const onZoomChanged = React.useCallback(() => {
    if (!map) return
    // @ts-expect-error
    setZoom(map.getZoom())
  }, [map])
  const staticUrl = React.useMemo(() => {
    if (!coords) return
    const queries = {
      key: googleMapsApiKey,
      size: `${mapHeight}x${mapHeight}`,
      zoom: zoom,
      center: `${coords.lat},${coords.lng}`,
      markers: `color:red|${coords.lat},${coords.lng}`,
    }
    return `${apiUrl}?${queryString.stringify(queries)}`
  }, [coords, googleMapsApiKey, zoom])

  return coords ? (
    <figure>
      {isOpen ? (
        <LoadScript googleMapsApiKey={googleMapsApiKey || ''}>
          <GoogleMap
            onLoad={(map) => setMap(map)}
            onUnmount={() => setMap(null)}
            mapContainerStyle={{
              height: 300,
            }}
            center={coords}
            zoom={zoom}
            onZoomChanged={onZoomChanged}
          >
            <Marker
              animation={2} // DOCUMENTATION IS POOR, THIS IS DROP ANIMATION
              position={coords}
              draggable
              onDragEnd={(e) => {
                const { lat, lng } = e.latLng.toJSON()
                onChange({
                  latitude: lat,
                  longitude: lng,
                })
              }}
            ></Marker>
          </GoogleMap>
        </LoadScript>
      ) : (
        <img
          className="ob-location__map"
          alt={`map with center at ${coords.lat} latitude, ${coords.lng} longitude`}
          src={staticUrl}
          height={mapHeight}
          width={mapHeight}
        />
      )}
    </figure>
  ) : null
})

export default React.memo(FormElementLocation)
