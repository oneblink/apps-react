import * as React from 'react'
import { FormTypes, APINSWTypes } from '@oneblink/types'
import { formService } from '@oneblink/apps'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import AutocompleteDropdown from '../components/renderer/AutocompleteDropdown'
import useIsMounted from '../hooks/useIsMounted'

type Props = {
  formId: number
  id: string
  element: FormTypes.APINSWLiquorLicenceElement
  value: APINSWTypes.LiquorLicenceDetails | undefined
  onChange: FormElementValueChangeHandler<APINSWTypes.LiquorLicenceDetails>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

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
}: Props) {
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
          `${result.licenceNumber} ${result.licenceName}`.trim() ||
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

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (((isDirty || displayValidationMessage) &&
      !!validationMessage &&
      !isLoading) ||
      error) &&
    !isLookingUp

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
        />

        {isDisplayingValidationMessage && (
          <div role="alert" className="has-margin-top-8">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {error?.message || validationMessage}
            </div>
          </div>
        )}
      </FormElementLabelContainer>

      {value && (
        <div className="ob-api-nsw-liquor-licence__record-display">
          <pre>{JSON.stringify(value, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default React.memo(FormElementAPINSWLiquorLicence)
