import * as React from 'react'
import { FormTypes, GoogleTypes } from '@oneblink/types'
import { OneBlinkAppsError, Sentry } from '@oneblink/apps'

import AutocompleteDropdown from '../components/renderer/AutocompleteDropdown'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import useGoogle from '../hooks/useGoogle'
import useIsMounted from '../hooks/useIsMounted'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'

type Props = {
  formId: number
  id: string
  element: FormTypes.GoogleAddressElement
  value: GoogleTypes.GoogleMapsAddress | undefined
  displayValidationMessage: boolean
  validationMessage: string | undefined
  onChange: FormElementValueChangeHandler<GoogleTypes.GoogleMapsAddress>
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
              if (
                status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
              ) {
                resolve([])
                return
              }
              if (status !== google.maps.places.PlacesServiceStatus.OK) {
                reject('Google Places service not available')
                return
              }
              resolve(predictions ?? [])
              return
            },
          )
        }).catch((e) => {
          if (!abortSignal.aborted) {
            Sentry.captureException(e)
          }
          throw new OneBlinkAppsError(
            'An unknown error has occurred. Please contact support if the problem persists.',
            { originalError: e },
          )
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
        const place = await new Promise<GoogleTypes.GoogleMapsAddress>(
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
                    `Could not find address details for place with id: ${placeId}`,
                  )
                  return
                }
                resolve(place)
              },
            )
          },
        )
        onChange(element, { value: place })
      } catch (newError) {
        if (isMounted.current) {
          setError(
            new OneBlinkAppsError(
              'An unknown error has occurred. Please contact support if the problem persists.',
              {
                originalError: newError as Error,
              },
            ),
          )
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
        />
      </FormElementLabelContainer>

      {error && (
        <div role="alert" className="has-margin-top-8">
          <div className="has-text-danger ob-error__text cypress-google-address-details-error-message">
            {error.toString()}
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(FormElementGoogleAddress)
