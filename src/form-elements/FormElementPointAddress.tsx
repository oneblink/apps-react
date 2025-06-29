import * as React from 'react'
import { formService } from '@oneblink/apps'

import AutocompleteDropdown from '../components/renderer/AutocompleteDropdown'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormTypes, PointTypes } from '@oneblink/types'
import useIsMounted from '../hooks/useIsMounted'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import { Collapse } from '@mui/material'
import {
  NotificationGrid,
  NotificationGridItem,
} from '../components/NotificationGrid'

type Props = {
  formId: number
  id: string
  element: FormTypes.PointAddressElement
  value: PointTypes.PointAddress | undefined
  displayValidationMessage: boolean
  validationMessage: string | undefined
  onChange: FormElementValueChangeHandler<PointTypes.PointAddress>
  autocompleteAttributes?: string
} & IsDirtyProps

type AddressType = 'all' | 'physical' | 'mailing'
const pointAddressClass = 'ob-point-address'

function FormElementPointAddress({
  formId,
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

  const handleSearch = React.useCallback(
    async (address: string, abortSignal: AbortSignal) => {
      setError(undefined)

      const params: {
        address: string
        maxNumberOfResults?: number
        stateTerritory?: string
        addressType?: AddressType
      } = {
        address,
        maxNumberOfResults: 10,
      }

      if (element.stateTerritoryFilter) {
        params.stateTerritory = element.stateTerritoryFilter.join(',')
      }
      if (element.addressTypeFilter) {
        let addressType: AddressType = 'all'
        if (element.addressTypeFilter.length === 1) {
          addressType = element.addressTypeFilter[0] as AddressType
        }
        params.addressType = addressType
      }

      const result = await formService.searchPointAddresses(
        formId,
        params,
        abortSignal,
      )

      return result.map((suggestion, index) => ({
        value: suggestion.id || index.toString(),
        label: suggestion.address || index.toString(),
      }))
    },
    [element.addressTypeFilter, element.stateTerritoryFilter, formId],
  )

  const handleChange = React.useCallback(
    async (addressId: string | undefined) => {
      if (!addressId) {
        onChange(element, { value: undefined })
        return
      }

      setIsLoadingAddressDetails(true)
      try {
        const result = await formService.getPointAddress(formId, addressId)
        onChange(element, { value: result })
      } catch (newError) {
        if (isMounted.current) {
          setError(newError as Error)
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
    if (value) {
      const newLabel = value.addressDetails?.formattedAddress || value.addressId
      if (label !== newLabel) {
        setLabel(newLabel || '')
      }
    }
    // we don't need this to run again when the label changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="cypress-point-address-element">
      <FormElementLabelContainer
        className={`${pointAddressClass} ob-autocomplete`}
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
          autoComplete={autocompleteAttributes}
        />
      </FormElementLabelContainer>

      {error && (
        <div role="alert" className="has-margin-top-8">
          <div className="has-text-danger ob-error__text cypress-point-address-details-error-message">
            {error.toString()}
          </div>
        </div>
      )}

      <Collapse in={!!value && !!element.isDisplayingAddressInformation}>
        <NotificationGrid
          className={`${pointAddressClass}__record-display has-margin-top-6`}
          gridClassName={`${pointAddressClass}__container`}
        >
          <PointAddressGridItem
            label="Local Government Area"
            value={value?.localGovernmentArea?.lgaName}
            classNameSuffix="local-government-area-name"
          />
          <PointAddressGridItem
            label="Lot / Section / Plan No."
            value={value?.addressDetails?.cadastralIdentifier}
            classNameSuffix="cadastral-identifier"
          />
          {value?.cadastralParcels?.map((cadastralParcel, index) => (
            <PointAddressGridItem
              key={cadastralParcel.propId || index}
              label="Lot / DP Numbers"
              value={cadastralParcel?.parcelId?.join(', ')}
              classNameSuffix="cadastral-parcel"
            />
          ))}
        </NotificationGrid>
      </Collapse>
    </div>
  )
}

function PointAddressGridItem({
  label,
  classNameSuffix,
  value,
}: {
  label: string
  classNameSuffix: string
  value: string | undefined
}) {
  return (
    <NotificationGridItem
      className={`${pointAddressClass}__container-${classNameSuffix}`}
      value={value}
      label={label}
      labelClassName={`${pointAddressClass}__detail-label`}
      valueClassName={`${pointAddressClass}__detail-value`}
    />
  )
}

export default React.memo(FormElementPointAddress)
