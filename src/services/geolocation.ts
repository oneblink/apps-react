type PositionLike = Omit<Partial<GeolocationPosition>, 'coords'> & {
  coords: Partial<GeolocationCoordinates>
}

type PositionOptionsLike = Partial<PositionOptions>

type GeolocationDriver = {
  getCurrentPosition: (
    success: (position: PositionLike) => any,
    error: (error: GeolocationPositionError | Error) => any,
    options: PositionOptions,
  ) => any
  isAvailable: () => boolean
}

const DEFAULT_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0, // fresh results each time
  timeout: 10 * 1000, // take no longer than 10 seconds
}

function clonePosition(position: PositionLike): PositionLike {
  position = position || {}
  const coords = position.coords || {}
  if (typeof position !== 'object' || typeof coords !== 'object') {
    throw new TypeError('cannot clone non-Position object')
  }
  return {
    coords: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: coords.altitude,
      accuracy: coords.accuracy,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading,
      speed: coords.speed,
    },
    timestamp: position.timestamp || Date.now(),
  }
}

function mergePositionOptions(options?: PositionOptionsLike): PositionOptions {
  options = options || {}
  if (typeof options !== 'object') {
    return DEFAULT_POSITION_OPTIONS
  }

  return {
    enableHighAccuracy:
      typeof options.enableHighAccuracy === 'boolean'
        ? options.enableHighAccuracy
        : DEFAULT_POSITION_OPTIONS.enableHighAccuracy,

    maximumAge:
      typeof options.maximumAge === 'number' && !isNaN(options.maximumAge)
        ? options.maximumAge
        : DEFAULT_POSITION_OPTIONS.maximumAge,

    timeout:
      typeof options.timeout === 'number' && !isNaN(options.timeout)
        ? options.timeout
        : DEFAULT_POSITION_OPTIONS.timeout,
  }
}

const DRIVERS_PREFERENCE = ['W3C']

const DRIVERS: { [id: string]: GeolocationDriver } = {
  W3C: {
    isAvailable: function (): boolean {
      return !!(
        typeof navigator !== 'undefined' &&
        navigator.geolocation &&
        typeof navigator.geolocation.getCurrentPosition === 'function'
      )
    },

    getCurrentPosition: function (
      onSuccess: (position: PositionLike) => any,
      onError: (error: GeolocationPositionError) => any,
      options: PositionOptions,
    ): void {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          onSuccess(clonePosition(position))
        },
        onError,
        options,
      )
    },
  },
}

function detectDriver(): GeolocationDriver | false {
  const availableDriver = DRIVERS_PREFERENCE.map(function (name) {
    return DRIVERS[name]
  }).find(function (driver) {
    return driver.isAvailable()
  })
  return availableDriver || false
}

export function getCurrentPosition(
  options?: PositionOptionsLike,
): Promise<PositionLike> {
  return new Promise(function (resolve, reject) {
    const driver = detectDriver()
    if (!driver) {
      return reject(new Error('GeoLocation not supported'))
    }
    driver.getCurrentPosition(
      function (position) {
        resolve(position)
      },
      function (err) {
        reject(err)
      },
      mergePositionOptions(options),
    )
  })
}
