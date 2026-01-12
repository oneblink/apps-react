import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import { Sentry } from '../apps'
import clsx from 'clsx'
import { GoogleMap, Marker } from '@react-google-maps/api'
import queryString from 'query-string'

import useBooleanState from '../hooks/useBooleanState'
import useIsOffline from '../hooks/useIsOffline'
import * as geolocation from '../services/geolocation'
import OnLoading from '../components/renderer/OnLoading'
import defaultCoords from '../services/defaultCoordinates'
import useGoogle from '../hooks/useGoogle'
import useGoogleMapsApiKey from '../hooks/useGoogleMapsApiKey'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import { useReverseGeocodeContext } from '../components/renderer/ReverseGeocode'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

type Props = {
  id: string
  element: FormTypes.LocationElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<Coords>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

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

export function parseLocationValue(value: unknown): Coords | undefined {
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
  isDirty,
  setIsDirty,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const [isLocationPickerOpen, showLocationPicker, hideLocationPicker] =
    useBooleanState(false)

  const [location, setLocation] = React.useState<Coords | undefined>(undefined)
  const onClear = React.useCallback(() => {
    hideLocationPicker()
    onChange(element, {
      value: undefined,
    })
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
    onChange(element, {
      value: location,
    })
  }, [element, hideLocationPicker, location, onChange, setIsDirty])

  // SET DEFAULT/PREFILL DATA
  React.useEffect(() => {
    const newValue = parseLocationValue(value)
    if (newValue) {
      setLocation(newValue)
    }
  }, [value])

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp

  const { isReverseGeocoding, reverseGeocodingErrorMsg } =
    useReverseGeocodeContext()

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
            {isLocationPickerOpen || isReverseGeocoding ? (
              <>
                <button
                  type="button"
                  className="is-light button ob-button ob-button__cancel ob-location__button ob-location__button-cancel cypress-cancel-location-button"
                  onClick={onCancel}
                  disabled={element.readOnly || isReverseGeocoding}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={clsx(
                    'is-primary button ob-button ob-button__confirm ob-location__button ob-location__button-confirm cypress-confirm-location-button',
                    {
                      'is-loading': isReverseGeocoding,
                    },
                  )}
                  onClick={onConfirm}
                  disabled={element.readOnly || !location || isReverseGeocoding}
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
                  onBlur={setIsDirty}
                  id={id}
                  aria-describedby={ariaDescribedby}
                >
                  Locate
                </button>
              </>
            )}
          </div>
        </div>

        {isDisplayingValidationMessage && (
          <FormElementValidationMessage message={validationMessage} />
        )}
        {reverseGeocodingErrorMsg && (
          <FormElementValidationMessage message={reverseGeocodingErrorMsg} />
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
        <h4 className="title is-4" role="alert">
          You are currently offline
        </h4>
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
  const googleMapsApiKey = useGoogleMapsApiKey()

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

const LocationPicker = React.memo(function LocationPicker({
  location,
  onChange,
}: {
  location: Coords
  onChange: (newLocation: Coords) => void
}) {
  const { isLoaded } = useGoogle()

  return (
    <figure className="ob-figure">
      {isLoaded && (
        <GoogleLocationPicker location={location} onChange={onChange} />
      )}
    </figure>
  )
})

const GoogleLocationPicker = React.memo(function GoogleLocationPicker({
  location,
  onChange,
}: {
  location: Coords
  onChange: (newLocation: Coords) => void
}) {
  const [map, setMap] = React.useState<google.maps.Map | null>(null)
  const [marker, setMarker] = React.useState<google.maps.Marker | null>(null)

  const originalCenter = React.useRef<{ lat: number; lng: number }>({
    lat: location.latitude,
    lng: location.longitude,
  })

  const markerAnimation = React.useMemo(() => google.maps.Animation.DROP, [])

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

  const handleDragEnd = React.useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) {
        return
      }
      const { lat, lng } = e.latLng.toJSON()
      onChange({
        latitude: lat,
        longitude: lng,
        zoom: location.zoom,
      })
      if (map) {
        map.panTo(e.latLng)
      }
    },
    [location.zoom, map, onChange],
  )

  const handleClick = React.useCallback(
    (e: google.maps.MapMouseEvent) => {
      handleDragEnd(e)

      if (!e.latLng || !marker) {
        return
      }

      marker.setPosition(e.latLng)
      // this enables the marker to animate after moving it
      marker.setMap(null)
      marker.setAnimation(markerAnimation)
      marker.setMap(map)
    },
    [handleDragEnd, map, marker, markerAnimation],
  )

  return (
    <GoogleMap
      onLoad={(map) => setMap(map)}
      onUnmount={() => setMap(null)}
      mapContainerStyle={{
        height: 300,
      }}
      center={originalCenter.current}
      zoom={location.zoom}
      onZoomChanged={onZoomChanged}
      onClick={handleClick}
      options={{ draggableCursor: 'pointer' }}
    >
      <Marker
        onLoad={(marker) => setMarker(marker)}
        onUnmount={() => setMarker(null)}
        animation={markerAnimation}
        position={originalCenter.current}
        draggable
        onDragEnd={handleDragEnd}
      ></Marker>
    </GoogleMap>
  )
})

export default React.memo(FormElementLocation)
