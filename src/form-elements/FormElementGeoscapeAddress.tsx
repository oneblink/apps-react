import * as React from 'react'
import { formService } from '@oneblink/apps'

import AutocompleteDropdown from '../components/AutocompleteDropdown'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import { FormTypes, GeoscapeTypes } from '@oneblink/types'
import useIsMounted from '../hooks/useIsMounted'

type Props = {
  formId: number
  id: string
  element: FormTypes.GeoscapeAddressElement
  value: GeoscapeTypes.GeoscapeAddress | undefined
  displayValidationMessage: boolean
  validationMessage: string | undefined
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: GeoscapeTypes.GeoscapeAddress | undefined,
  ) => void
}

function FormElementGeoscapeAddress({
  formId,
  id,
  element,
  value,
  displayValidationMessage,
  validationMessage,
  onChange,
}: Props) {
  const isMounted = useIsMounted()
  const [label, setLabel] = React.useState('')
  const [error, setError] = React.useState<Error | undefined>()
  const [isLoadingAddressDetails, setIsLoadingAddressDetails] = React.useState(
    false,
  )

  const handleSearch = React.useCallback(
    async (search, abortSignal) => {
      setError(undefined)

      const result = await formService.searchGeoscapeAddresses(
        formId,
        search,
        abortSignal,
      )

      return result.suggest.map((suggestion, index) => ({
        value: suggestion.id || index.toString(),
        label: suggestion.address || index.toString(),
      }))
    },
    [formId],
  )

  const handleChange = React.useCallback(
    async (addressId: string | undefined) => {
      if (!addressId) {
        onChange(element, undefined)
        return
      }

      setIsLoadingAddressDetails(true)
      try {
        const result = await formService.getGeoscapeAddress(formId, addressId)
        onChange(element, result)
      } catch (newError) {
        if (isMounted.current) {
          setError(newError)
        }
      }
      if (isMounted.current) {
        setIsLoadingAddressDetails(false)
      }
    },
    [isMounted, onChange, element, formId],
  )

  // Ensure the label is set if the value is set outside of this component
  React.useEffect(() => {
    if (!label && value) {
      const newLabel =
        value.addressDetails && value.addressDetails.formattedAddress
          ? value.addressDetails.formattedAddress
          : value.addressId
      setLabel(newLabel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="cypress-geoscape-address-element">
      <FormElementLabelContainer
        className="ob-geoscape-address ob-autocomplete"
        element={element}
        id={id}
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
        />
      </FormElementLabelContainer>

      {error && (
        <div role="alert " className="has-margin-top-8">
          <div className="has-text-danger ob-error__text cypress-geoscape-address-details-error-message">
            {error.toString()}
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(FormElementGeoscapeAddress)
