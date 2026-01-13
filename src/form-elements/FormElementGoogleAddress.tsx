import * as React from 'react'
import { FormTypes, GoogleTypes } from '@oneblink/types'
import { OneBlinkAppsError, Sentry } from '../apps'

import AutocompleteDropdown from '../components/renderer/AutocompleteDropdown'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import useGoogle from '../hooks/useGoogle'
import useIsMounted from '../hooks/useIsMounted'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

type Props = {
  formId: number
  id: string
  element: FormTypes.GoogleAddressElement
  value: GoogleTypes.GoogleMapsAddress | undefined
  displayValidationMessage: boolean
  validationMessage: string | undefined
  onChange: FormElementValueChangeHandler<GoogleTypes.GoogleMapsAddress>
  autocompleteAttributes?: string
} & IsDirtyProps

function FormElementGoogleAddress({
  id,
  element,
  value,
  displayValidationMessage,
  validationMessage,
  onChange,
  isDirty,
  setIsDirty,
  autocompleteAttributes,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const isMounted = useIsMounted()
  const [label, setLabel] = React.useState('')
  const [error, setError] = React.useState<Error | undefined>()
  const [isLoadingAddressDetails, setIsLoadingAddressDetails] =
    React.useState(false)

  const { isLoaded } = useGoogle()

  const autocompleteService = React.useMemo(() => {
    if (isLoaded) {
      return new google.maps.places.AutocompleteService()
    }
  }, [isLoaded])

  const dummyMap = React.useMemo(() => {
    if (isLoaded) {
      return new google.maps.Map(document.createElement('div'))
    }
  }, [isLoaded])

  const handleSearch = React.useCallback(
    async (input: string, abortSignal: AbortSignal) => {
      setError(undefined)
      if (autocompleteService) {
        const predictions = await new Promise<
          google.maps.places.QueryAutocompletePrediction[]
        >((resolve, reject) => {
          autocompleteService.getQueryPredictions(
            {
              input,
            },
            (predictions, status) => {
              switch (status) {
                case google.maps.places.PlacesServiceStatus.OK:
                case google.maps.places.PlacesServiceStatus.ZERO_RESULTS: {
                  resolve(predictions ?? [])
                  break
                }
                case google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT: {
                  reject(
                    new OneBlinkAppsError(
                      'This application has gone over its Google Address querying quota. Please contact an administrator to rectify the issue or try again later.',
                    ),
                  )
                  break
                }
                case google.maps.places.PlacesServiceStatus.INVALID_REQUEST: {
                  reject(
                    new OneBlinkAppsError(
                      'Google Maps API key may not have been configured correctly, the request to retrieve address suggestions is invalid. Please contact an administrator to rectify the issue.',
                    ),
                  )
                  break
                }
                case google.maps.places.PlacesServiceStatus.REQUEST_DENIED: {
                  reject(
                    new OneBlinkAppsError(
                      'Google Maps API key has not been configured correctly. Please contact an administrator to rectify the issue.',
                    ),
                  )
                  break
                }
                default: {
                  reject(
                    new OneBlinkAppsError(
                      'An unknown error has occurred. Please try again and contact support if the problem persists.',
                    ),
                  )
                }
              }
            },
          )
        }).catch((e) => {
          if (!abortSignal.aborted) {
            Sentry.captureException(e)
          }
          throw e
        })

        if (!abortSignal.aborted) {
          return predictions.reduce<Array<{ value: string; label: string }>>(
            (results, prediction) => {
              if (prediction.place_id) {
                results.push({
                  value: prediction.place_id,
                  label: prediction.description,
                })
              }
              return results
            },
            [],
          )
        }
      }
      throw new OneBlinkAppsError(
        'An unknown error has occurred. Please contact support if the problem persists.',
      )
    },
    [autocompleteService],
  )

  const handleChange = React.useCallback(
    async (placeId: string | undefined) => {
      if (!placeId) {
        onChange(element, { value: undefined })
        return
      }

      setIsLoadingAddressDetails(true)
      try {
        //this should not happen, we can't get a place Id without google being present
        if (!isLoaded || !dummyMap) {
          throw new OneBlinkAppsError(
            'An unknown error has occurred. Please contact support if the problem persists.',
            {
              originalError: new Error(
                'Google Places library has not be initialised',
              ),
            },
          )
        }

        const placeService = new google.maps.places.PlacesService(dummyMap)
        const place = await new Promise<google.maps.places.PlaceResult>(
          (resolve, reject) => {
            placeService.getDetails(
              {
                placeId,
                fields: [
                  'place_id',
                  'formatted_address',
                  'geometry',
                  'address_components',
                ],
              },
              (place, status) => {
                if (
                  status !== google.maps.places.PlacesServiceStatus.OK ||
                  !place
                ) {
                  reject(
                    new OneBlinkAppsError(
                      `Could not find address details for place with id: ${placeId}`,
                    ),
                  )
                  return
                }
                resolve(place)
              },
            )
          },
        )
        onChange(element, {
          value: {
            place_id: place.place_id,
            formatted_address: place.formatted_address,
            address_components: place.address_components,
            geometry: {
              location: place.geometry?.location?.toJSON(),
              viewport: place.geometry?.viewport?.toJSON(),
            },
          },
        })
      } catch (newError) {
        if (isMounted.current) {
          setError(newError as Error)
        }
      }
      if (isMounted.current) {
        setIsLoadingAddressDetails(false)
      }
    },
    [isMounted, onChange, element, isLoaded, dummyMap],
  )

  // Ensure the label is set if the value is set outside of this component
  React.useEffect(() => {
    if (value) {
      const newLabel = value.formatted_address || value.place_id
      setLabel(newLabel ?? '')
    }
  }, [value])

  return (
    <div className="cypress-google-address-element">
      <FormElementLabelContainer
        className="ob-google-address ob-autocomplete"
        element={element}
        id={id}
        required={element.required}
      >
        <AutocompleteDropdown
          id={id}
          label={label}
          disabled={element.readOnly || isLoadingAddressDetails}
          placeholder={element.placeholderValue}
          required={element.required}
          value={value}
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
          onChangeValue={handleChange}
          isLoading={isLoadingAddressDetails}
          hasError={!!error}
          onChangeLabel={setLabel}
          searchDebounceMs={750}
          searchMinCharacters={4}
          onSearch={handleSearch}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
          aria-describedby={ariaDescribedby}
          branding={
            <a className="dropdown-item cypress-powered-by-google ob-autocomplete__drop-down-item-powered-by-google">
              powered by{' '}
              <img src="https://developers.google.com/static/maps/documentation/images/google_on_white.png" />
            </a>
          }
          autoComplete={autocompleteAttributes}
        />
      </FormElementLabelContainer>

      {error && (
        <FormElementValidationMessage
          message={error.toString()}
          className="cypress-google-address-details-error-message"
        />
      )}
    </div>
  )
}

export default React.memo(FormElementGoogleAddress)
