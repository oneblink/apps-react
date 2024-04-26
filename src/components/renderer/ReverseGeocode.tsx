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
    if (element.reverseGeocoding?.formattedAddressElementId) {
      return formElementsService.findFormElement(
        formSubmissionModel.elements,
        (el) => el.id === element.reverseGeocoding?.formattedAddressElementId,
      )
    }
  }, [
    element.reverseGeocoding?.formattedAddressElementId,
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
          if (element.reverseGeocoding && formattedAddressElement) {
            const mergeReverseGeocodeResult: SubmissionTypes.S3SubmissionData['submission'] =
              {}
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
                  mergeReverseGeocodeResult[formattedAddressElement.name] =
                    reverseGeocodeResult.addressDetails?.formattedAddress
                }
                break
              }
              case 'geoscapeAddress': {
                mergeReverseGeocodeResult[formattedAddressElement.name] =
                  reverseGeocodeResult
                break
              }
            }
            if (!abortController.signal.aborted) {
              mergeReverseGeocodeData(mergeReverseGeocodeResult)
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
    element.reverseGeocoding,
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
