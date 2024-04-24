import * as React from 'react'

import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { formService, OneBlinkAppsError } from '@oneblink/apps'
import { formElementsService } from '@oneblink/sdk-core'

import { parseLocationValue } from '../../form-elements/FormElementLocation'
import useFormSubmissionModel from '../../hooks/useFormSubmissionModelContext'
import useFormDefinition from '../../hooks/useFormDefinition'
import useFormIsReadOnly from '../../hooks/useFormIsReadOnly'
import { FormElementLookupHandler } from '../../types/form'
import useIsOffline from '../../hooks/useIsOffline'

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
  onLookup,
  children,
}: React.PropsWithChildren<{
  value: unknown
  element: FormTypes.LocationElement
  onLookup: FormElementLookupHandler
}>) {
  const coords = React.useMemo(() => parseLocationValue(value), [value])
  const [reverseGeocodingState, setReverseGeocodingState] =
    React.useState<ReverseGeocodeContextValue>({
      isReverseGeocoding: false,
    })
  const isOffline = useIsOffline()

  const formDefinition = useFormDefinition()
  const formSubmissionModel = useFormSubmissionModel()
  const formIsReadOnly = useFormIsReadOnly()

  const formattedAddressElement = React.useMemo(() => {
    if (element.showStreetAddress && element.formattedAddressElementId) {
      return formElementsService.findFormElement(
        formSubmissionModel.elements,
        (el) => el.id === element.formattedAddressElementId,
      )
    }
  }, [
    element.formattedAddressElementId,
    element.showStreetAddress,
    formSubmissionModel.elements,
  ])

  const mergeReverseGeocodeData = React.useCallback(
    (reverseGeocodeResult: SubmissionTypes.S3SubmissionData['submission']) => {
      onLookup(({ submission, elements, executedLookups }) => {
        return {
          elements,
          submission: {
            ...submission,
            ...reverseGeocodeResult,
          },
          executedLookups,
        }
      })
    },
    [onLookup],
  )

  React.useEffect(() => {
    const abortController = new AbortController()
    const effect = async () => {
      setReverseGeocodingState({ isReverseGeocoding: true })
      try {
        if (coords && formattedAddressElement) {
          if (element.showStreetAddress && formattedAddressElement) {
            const reverseGeocodeResult: SubmissionTypes.S3SubmissionData['submission'] =
              {}
            switch (formattedAddressElement.type) {
              case 'text': {
                const {
                  reverseGeocodeResult: { formatted_address },
                } = await formService.getGoogleMapsReverseGeocoding({
                  lat: coords.latitude,
                  lng: coords.longitude,
                  formId: formDefinition.id,
                  abortSignal: abortController.signal,
                })
                reverseGeocodeResult[formattedAddressElement.name] =
                  formatted_address
                break
              }
              case 'geoscapeAddress': {
                const { reverseGeocodeResult: geoscapeReverseGeocodeResult } =
                  await formService.getGeoscapeReverseGeocoding({
                    lat: coords.latitude,
                    lng: coords.longitude,
                    formId: formDefinition.id,
                    abortSignal: abortController.signal,
                  })
                reverseGeocodeResult[formattedAddressElement.name] =
                  geoscapeReverseGeocodeResult
                break
              }
            }
            if (!abortController.signal.aborted) {
              mergeReverseGeocodeData(reverseGeocodeResult)
            }
          }
        }
        setReverseGeocodingState({
          isReverseGeocoding: false,
        })
      } catch (e) {
        let errorMsg = 'Could not find your address.'
        if (e instanceof OneBlinkAppsError && e.httpStatusCode !== 404) {
          errorMsg = e.message
        }

        if (isOffline) {
          errorMsg =
            'It looks like you&apos;re offline. Please try again when connectivity is restored.'
        }
        setReverseGeocodingState({
          isReverseGeocoding: false,
          reverseGeocodingErrorMsg: errorMsg,
        })
      }
    }

    if (!formIsReadOnly) {
      effect()
    }

    return () => abortController.abort()
  }, [
    coords,
    element.showStreetAddress,
    formDefinition.id,
    formDefinition.organisationId,
    formattedAddressElement,
    mergeReverseGeocodeData,
    isOffline,
    formIsReadOnly,
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
