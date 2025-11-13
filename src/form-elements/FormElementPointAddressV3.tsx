import * as React from 'react'
import { formService } from '@oneblink/apps'

import AutocompleteDropdown from '../components/renderer/AutocompleteDropdown'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormTypes, PointTypes } from '@oneblink/types'
import useIsMounted from '../hooks/useIsMounted'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import { Collapse } from '@mui/material'
import { NotificationGrid } from '../components/NotificationGrid'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'
import { PointAddressGridItem } from './FormElementPointAddress'

type Props = {
  formId: number
  id: string
  element: FormTypes.PointAddressV3Element
  value: PointTypes.PointAddressV3GetAddressDetailsResponse | undefined
  displayValidationMessage: boolean
  validationMessage: string | undefined
  onChange: FormElementValueChangeHandler<PointTypes.PointAddressV3GetAddressDetailsResponse>
  autocompleteAttributes?: string
} & IsDirtyProps

type AddressType = 'all' | 'physical' | 'mailing'
const pointAddressClass = 'ob-point-address-v3'

function FormElementPointAddressV3({
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
        stateFilter?: string
        excludeAliases?: boolean
        addressType?: AddressType
        dataset?: string
      } = {
        address,
        maxNumberOfResults: 10,
      }

      if (element.stateTerritoryFilter) {
        params.stateFilter = element.stateTerritoryFilter.join(',')
      }
      if (element.addressTypeFilter) {
        let addressType: AddressType = 'all'
        if (element.addressTypeFilter.length === 1) {
          addressType = element.addressTypeFilter[0] as AddressType
        }
        params.addressType = addressType
      }
      if (element.datasetFilter?.length) {
        params.dataset = element.datasetFilter.join(',')
      }
      if (element.excludeAliases) {
        params.excludeAliases = true
      }

      const { suggest } = await formService.searchPointV3Addresses(
        formId,
        params,
        abortSignal,
      )

      return (suggest || []).map((suggestion, index) => ({
        value: suggestion.id || index.toString(),
        label: suggestion.address || index.toString(),
      }))
    },
    [
      element.addressTypeFilter,
      element.datasetFilter,
      element.excludeAliases,
      element.stateTerritoryFilter,
      formId,
    ],
  )

  const handleChange = React.useCallback(
    async (addressId: string | undefined) => {
      if (!addressId) {
        onChange(element, { value: undefined })
        return
      }

      setIsLoadingAddressDetails(true)
      try {
        const result = await formService.getPointV3Address(formId, {
          addressId,
        })
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
      const newLabel =
        value.properties?.formattedAddress || value.properties?.addressId
      if (label !== newLabel) {
        setLabel(newLabel || '')
      }
    }
    // we don't need this to run again when the label changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="cypress-point-address-v3-element">
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
        <FormElementValidationMessage
          message={error.toString()}
          className="cypress-point-address-v3-details-error-message"
        />
      )}

      <Collapse in={!!value && !!element.isDisplayingAddressInformation}>
        <NotificationGrid
          className={`${pointAddressClass}__record-display has-margin-top-6`}
          gridClassName={`${pointAddressClass}__container`}
        >
          <PointAddressGridItem
            label="Local Government Area"
            value={value?.properties?.localGovernmentArea?.lgaName}
            classNameSuffix="local-government-area-name"
          />
          <PointAddressGridItem
            label="Lot / Section / Plan No."
            value={value?.properties?.cadastralIdentifier}
            classNameSuffix="cadastral-identifier"
          />
          {value?.properties?.parcelBundle?.map((parcel, index) => (
            <PointAddressGridItem
              key={parcel.parcelId || index}
              label="Lot / DP Numbers"
              value={`${parcel.lot}//${parcel.plan}`}
              classNameSuffix="cadastral-parcel"
            />
          ))}
        </NotificationGrid>
      </Collapse>
    </div>
  )
}

export default React.memo(FormElementPointAddressV3)
