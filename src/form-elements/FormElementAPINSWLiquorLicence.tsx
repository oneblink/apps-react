import * as React from 'react'
import { FormTypes, APINSWTypes } from '@oneblink/types'
import { formService } from '@oneblink/apps'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import AutocompleteDropdown from '../components/renderer/AutocompleteDropdown'
import useIsMounted from '../hooks/useIsMounted'
import { Collapse, Grid } from '@mui/material'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import {
  NotificationGrid,
  NotificationGridItem,
} from '../components/NotificationGrid'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

type Props = {
  formId: number
  id: string
  element: FormTypes.APINSWLiquorLicenceElement
  value: APINSWTypes.LiquorLicenceDetails | undefined
  onChange: FormElementValueChangeHandler<APINSWTypes.LiquorLicenceDetails>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  autocompleteAttributes?: string
} & IsDirtyProps

const liquorLicenceClassPrefix = 'ob-api-nsw-liquor-licence__'
function FormElementAPINSWLiquorLicence({
  formId,
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
  autocompleteAttributes,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const isMounted = useIsMounted()
  const [label, setLabel] = React.useState('')
  const [{ isLoading, error }, setState] = React.useState<{
    isLoading: boolean
    error: Error | null
  }>({
    isLoading: false,
    error: null,
  })

  const handleSearch = React.useCallback(
    async (searchText: string, abortSignal: AbortSignal) => {
      setState((current) => ({
        ...current,
        error: null,
      }))

      const results = await formService.searchAPINSWLiquorLicences(
        { formId, searchText },
        abortSignal,
      )

      return results.map((result, index) => ({
        value: result.licenceID || index.toString(),
        label:
          `${result.licenceNumber} | ${result.licenceName}`.trim() ||
          index.toString(),
      }))
    },
    [formId],
  )

  const fetchAndSelectSingleLicence = React.useCallback(
    async (newValue: string | undefined) => {
      console.log(`Selected: ${newValue}`)
      if (!newValue) {
        onChange(element, { value: undefined })
        return
      }
      setState((current) => ({
        ...current,
        isLoading: true,
      }))

      try {
        const result = await formService.getAPINSWLiquorLicence(
          formId,
          newValue,
        )
        if (result) {
          onChange(element, { value: result })
        }
        if (isMounted.current) {
          setState({
            isLoading: false,
            error: null,
          })
        }
      } catch (newError) {
        if (isMounted.current) {
          setState({
            isLoading: false,
            error: newError as Error,
          })
        }
      }
    },
    [element, formId, isMounted, onChange],
  )

  // Ensure the label is set if the value is set outside of this component
  React.useEffect(() => {
    if (value) {
      const newLabel =
        `${value?.licenceDetail?.licenceNumber} | ${value?.licenceDetail?.licenceName}`.trim()
      if (label !== newLabel) {
        setLabel(newLabel || '')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="cypress-api-nsw-liquor-licence-element">
      <FormElementLabelContainer
        className="ob-api-nsw-liquor-licence ob-autocomplete"
        id={id}
        element={element}
        required={element.required}
      >
        <AutocompleteDropdown
          id={id}
          label={label}
          disabled={element.readOnly || isLoading}
          placeholder={element.placeholderValue}
          required={element.required}
          value={value}
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
          onChangeValue={fetchAndSelectSingleLicence}
          isLoading={isLoading}
          hasError={!!error}
          onChangeLabel={setLabel}
          searchDebounceMs={750}
          searchMinCharacters={2}
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
          className="cypress-api-nsw-liquor-licence-error-message"
        />
      )}
      <Collapse in={!!value}>
        <NotificationGrid
          className={`${liquorLicenceClassPrefix}record-display has-margin-top-6`}
          gridClassName={`${liquorLicenceClassPrefix}container`}
        >
          {value?.licenceDetail?.licenceName && (
            <Grid
              size={{ xs: 12 }}
              className={`${liquorLicenceClassPrefix}licenceName`}
            >
              <h6
                className={`is-size-5 has-text-weight-semibold ${liquorLicenceClassPrefix}name`}
              >
                {value?.licenceDetail?.licenceName}
              </h6>
            </Grid>
          )}
          <LicenceDetailGridItem
            label="Licence Number"
            value={value?.licenceDetail?.licenceNumber}
            classNameSuffix="licenceNumber"
          />
          <LicenceDetailGridItem
            label="Licence Type"
            value={value?.licenceDetail?.licenceTypeName}
            classNameSuffix="licenceTypeName"
          />
          <LicenceDetailGridItem
            label="Licensee"
            value={value?.licenceDetail?.licensee}
            classNameSuffix="licensee"
          />
          <LicenceDetailGridItem
            label="Licensee Birth Date"
            value={value?.licenceDetail?.licenseeBirthdate}
            classNameSuffix="licenseeBirthdate"
          />
          <LicenceDetailGridItem
            label="Licencee ABN"
            value={value?.licenceDetail?.licenceeABN}
            classNameSuffix="licenceeABN"
          />
          <LicenceDetailGridItem
            label="Licencee ACN"
            value={value?.licenceDetail?.licenceeACN}
            classNameSuffix="licenceeACN"
          />
          <LicenceDetailGridItem
            label="Refused Date"
            value={value?.licenceDetail?.refusedDate}
            classNameSuffix="refusedDate"
          />
          <LicenceDetailGridItem
            label="Start Date"
            value={value?.licenceDetail?.startDate}
            classNameSuffix="startDate"
          />
          <LicenceDetailGridItem
            label="Expiry Date"
            value={value?.licenceDetail?.expiryDate}
            classNameSuffix="expiryDate"
          />
          <LicenceDetailGridItem
            label="Status"
            value={value?.licenceDetail?.status}
            classNameSuffix="status"
          />
          <LicenceDetailGridItem
            label="Address Type"
            value={value?.licenceDetail?.addressType}
            classNameSuffix="addressType"
          />
          <LicenceDetailGridItem
            label="Address"
            value={value?.licenceDetail?.address}
            classNameSuffix="address"
            fullWidth
          />
        </NotificationGrid>
      </Collapse>
    </div>
  )
}

export function LicenceDetailGridItem({
  label,
  value,
  classNameSuffix,
  fullWidth,
}: {
  label: string
  value: string | undefined
  classNameSuffix: string
  fullWidth?: boolean
}) {
  return (
    <NotificationGridItem
      className={`${liquorLicenceClassPrefix}${classNameSuffix}`}
      fullWidth={fullWidth}
      value={value}
      label={label}
      labelClassName={`${liquorLicenceClassPrefix}detail-label`}
      valueClassName={`${liquorLicenceClassPrefix}detail-value`}
    />
  )
}

export default React.memo(FormElementAPINSWLiquorLicence)
