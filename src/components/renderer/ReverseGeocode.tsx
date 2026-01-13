import * as React from 'react'

import { FormTypes, GeoscapeTypes } from '@oneblink/types'
import { formService, OneBlinkAppsError } from '../../apps'
import { formElementsService } from '@oneblink/sdk-core'

import { parseLocationValue } from '../../form-elements/FormElementLocation'
import useFormSubmissionModel from '../../hooks/useFormSubmissionModelContext'
import useFormDefinition from '../../hooks/useFormDefinition'
import useFormIsReadOnly from '../../hooks/useFormIsReadOnly'
import { FormElementValueChangeHandler } from '../../types/form'

type ReverseGeocodeContextValue = {
  isReverseGeocoding: boolean
  reverseGeocodingErrorMsg?: string
}

const ReverseGeocodeContext = React.createContext<ReverseGeocodeContextValue>({
  isReverseGeocoding: false,
})

export default function ReverseGeocode({
  value,
  element,
  onChange,
  children,
}: React.PropsWithChildren<{
  value: unknown
  element: FormTypes.LocationElement
  onChange: FormElementValueChangeHandler<
    GeoscapeTypes.GeoscapeAddress | string
  >
}>) {
  const coords = React.useMemo(() => parseLocationValue(value), [value])
  const [reverseGeocodingState, setReverseGeocodingState] =
    React.useState<ReverseGeocodeContextValue>({
      isReverseGeocoding: false,
    })

  const formDefinition = useFormDefinition()
  const formSubmissionModel = useFormSubmissionModel()
  const formIsReadOnly = useFormIsReadOnly()

  const formattedAddressElement = React.useMemo(() => {
    if (element.reverseGeocoding?.formattedAddressElementId) {
      return formElementsService
        .flattenFormElements(formSubmissionModel.elements)
        .find(
          (el) => el.id === element.reverseGeocoding?.formattedAddressElementId,
        )
    }
  }, [
    element.reverseGeocoding?.formattedAddressElementId,
    formSubmissionModel.elements,
  ])

  React.useEffect(() => {
    if (formIsReadOnly || !coords || !formattedAddressElement) {
      return
    }

    const abortController = new AbortController()
    const effect = async () => {
      try {
        setReverseGeocodingState({ isReverseGeocoding: true })
        const { reverseGeocodeResult } =
          await formService.getGeoscapeReverseGeocoding({
            lat: coords.latitude,
            lng: coords.longitude,
            formId: formDefinition.id,
            abortSignal: abortController.signal,
          })
        switch (formattedAddressElement.type) {
          case 'text': {
            if (reverseGeocodeResult.addressDetails?.formattedAddress) {
              onChange(formattedAddressElement, {
                value: reverseGeocodeResult.addressDetails?.formattedAddress,
              })
            }
            break
          }
          case 'geoscapeAddress': {
            onChange(formattedAddressElement, {
              value: reverseGeocodeResult,
            })
            break
          }
        }
        setReverseGeocodingState({
          isReverseGeocoding: false,
        })
      } catch (e) {
        if (abortController.signal.aborted) {
          return
        }
        console.warn('Error attempting to reverse geocode location', e)
        let errorMsg = 'Could not find your address.'
        if (e instanceof OneBlinkAppsError) {
          if (e.httpStatusCode !== 404) {
            errorMsg = e.message
          } else if (e.isOffline) {
            errorMsg =
              'It looks like you&apos;re offline. Please try again when connectivity is restored.'
          }
        }

        setReverseGeocodingState({
          isReverseGeocoding: false,
          reverseGeocodingErrorMsg: errorMsg,
        })
      }
    }

    effect()

    return () => abortController.abort()
  }, [
    coords,
    formDefinition.id,
    formIsReadOnly,
    formattedAddressElement,
    onChange,
  ])

  return (
    <ReverseGeocodeContext.Provider value={reverseGeocodingState}>
      {children}
    </ReverseGeocodeContext.Provider>
  )
}

export function useReverseGeocodeContext() {
  const reverseGeocodeContext = React.useContext(ReverseGeocodeContext)
  if (!reverseGeocodeContext) {
    throw new TypeError(
      'You have attempted to run the hook "useReverseGeocodeContext()" outside of the "ReverseGeocodeContext" context.',
    )
  }
  return reverseGeocodeContext
}
