import * as React from 'react'
import { formService } from '@oneblink/apps'

import AutocompleteDropdown from '../components/AutocompleteDropdown'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import { FormTypes, CivicaTypes } from '@oneblink/types'
import { FormElementValueChangeHandler } from '../types/form'

type Props = {
  formId: number
  id: string
  element: FormTypes.CivicaStreetNameElement
  value: CivicaTypes.CivicaStreetName | undefined
  displayValidationMessage: boolean
  validationMessage: string | undefined
  onChange: FormElementValueChangeHandler<CivicaTypes.CivicaStreetName>
}

function FormElementCivicaStreetName({
  formId,
  id,
  element,
  value,
  displayValidationMessage,
  validationMessage,
  onChange,
}: Props) {
  const [label, setLabel] = React.useState('')
  const [error, setError] = React.useState<Error | undefined>()

  const handleSearch = React.useCallback(
    async (searchTerm: string, abortSignal) => {
      setError(undefined)
      const results = await formService.searchCivicaStreetNames(
        formId,
        {
          search: searchTerm,
        },
        abortSignal,
      )
      return results.map((suggestion, index) => ({
        value: suggestion.formattedAccount || index.toString(),
        label: suggestion.formattedStreet || index.toString(),
        data: suggestion,
      }))
    },
    [formId],
  )

  const handleChange = React.useCallback(
    async (
      streetId: string | undefined,
      streetData?: CivicaTypes.CivicaStreetName,
    ) => {
      onChange(element, streetData)
    },
    [onChange, element],
  )

  // Ensure the label is set if the value is set outside of this component
  React.useEffect(() => {
    if (value) {
      const newLabel = value?.formattedStreet
      if (label !== newLabel) {
        setLabel(newLabel || '')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="cypress-civica-street-name-element">
      <FormElementLabelContainer
        className="ob-civica-street-name ob-autocomplete"
        element={element}
        id={id}
        required={element.required}
      >
        <AutocompleteDropdown
          id={id}
          label={label}
          disabled={element.readOnly}
          placeholder={element.placeholderValue}
          required={element.required}
          value={value}
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
          onChangeValue={handleChange}
          hasError={!!error}
          onChangeLabel={setLabel}
          searchDebounceMs={750}
          searchMinCharacters={4}
          onSearch={handleSearch}
        />
      </FormElementLabelContainer>

      {error && (
        <div role="alert" className="has-margin-top-8">
          <div className="has-text-danger ob-error__text cypress-civica-street-name-error-message">
            {error.toString()}
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(FormElementCivicaStreetName)
