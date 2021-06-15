import * as React from 'react'
import { formService } from '@oneblink/apps'
import { FormTypes, GeoscapeTypes, CivicaTypes } from '@oneblink/types'
import FormElementForm, { Props } from './FormElementForm'
import generateCivicaNameRecordElements from '../services/generateCivicaNameRecordElements'

function FormElementCivicaNameRecord({
  element,
  onChange,
  ...props
}: Omit<Props, 'element'> & {
  element: FormTypes.CivicaNameRecordElement
}) {
  const [state, setState] = React.useState<{
    isLoading: boolean
    titleCodeOptions?: FormTypes.ChoiceElementOption[]
    loadError?: Error
  }>({
    isLoading: true,
  })

  const formElement = React.useMemo<FormTypes.FormFormElement>(() => {
    return {
      id: element.id,
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      type: 'form',
      name: element.name,
      formId: NaN,
      elements: generateCivicaNameRecordElements(
        element,
        state.titleCodeOptions,
      ),
    }
  }, [element, state.titleCodeOptions])

  const handleChange = React.useCallback<Props['onChange']>(
    (e, newValue) => {
      onChange(element, (existingValue) => {
        if (typeof newValue === 'function') {
          newValue = newValue(existingValue)
        }
        if (
          element.useGeoscapeAddressing &&
          newValue &&
          Array.isArray(newValue.streetAddress) &&
          newValue.streetAddress.length
        ) {
          return {
            ...newValue,
            streetAddress: newValue.streetAddress.map((streetAddress) => {
              const geoscapeAddress = streetAddress.address1 as
                | GeoscapeTypes.GeoscapeAddress
                | undefined
              return {
                address1:
                  geoscapeAddress &&
                  [
                    geoscapeAddress?.addressDetails?.streetNumber1,
                    geoscapeAddress?.addressDetails?.streetName,
                    geoscapeAddress?.addressDetails?.streetType,
                  ]
                    .filter((str) => !!str)
                    .join(' '),
                address2: geoscapeAddress?.addressDetails?.localityName,
                postcode: geoscapeAddress?.addressDetails?.postcode,
              }
            }),
          } as CivicaTypes.CivicaNameRecord
        }
        return newValue
      })
    },
    [element, onChange],
  )

  React.useEffect(() => {
    setState({
      isLoading: true,
    })
    const abortController = new AbortController()

    const request = async () => {
      try {
        const items = await formService.getCivicaTitleCodes(
          props.formId,
          abortController.signal,
        )
        if (!abortController.signal.aborted) {
          setState({
            isLoading: false,
            titleCodeOptions: items,
          })
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          setState({
            isLoading: false,
            loadError: error,
          })
        }
      }
    }
    request()

    return () => {
      abortController.abort()
    }
  }, [props.formId])

  return (
    <FormElementForm element={formElement} onChange={handleChange} {...props} />
  )
}
export default React.memo(FormElementCivicaNameRecord)
