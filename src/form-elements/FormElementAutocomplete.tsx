import * as React from 'react'
import { generateHeaders } from '@oneblink/apps/dist/services/fetch'

import FormElementOptions from '../components/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import AutocompleteDropdown from '../components/AutocompleteDropdown'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import { FormTypes } from '@oneblink/types'

type _BaseProps = {
  id: string
  element: FormTypes.AutoCompleteElement
  value: unknown | undefined
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

type _AutocompleteChangeHandlerProps = _BaseProps & {
  onChange: (newValue: unknown | undefined) => void
}

type _AutocompleteConditionallyShowOptionProps = {
  onConditionallyShowOption: (
    choiceElementOption: FormTypes.ChoiceElementOption,
  ) => boolean
}

type AutocompleteFilterProps = _AutocompleteChangeHandlerProps &
  _AutocompleteConditionallyShowOptionProps

type AutocompleteFetchProps = _AutocompleteChangeHandlerProps & {
  searchUrl: string
}

type Props = _BaseProps &
  _AutocompleteConditionallyShowOptionProps & {
    onChange: (
      formElement: FormTypes.FormElement,
      newValue: unknown | undefined,
    ) => void
  }

const AutocompleteFilter = React.memo(function AutocompleteFilter({
  id,
  element,
  value,
  onChange,
  onConditionallyShowOption,
  validationMessage,
  displayValidationMessage,
}: AutocompleteFilterProps) {
  const [label, setLabel] = React.useState('')

  const onFilter = React.useCallback(
    (option) => {
      const isShowing = onConditionallyShowOption(option)
      if (!isShowing) {
        return false
      }

      // If the user has typed nothing in, display all options
      if (!label) {
        return true
      }

      const lowerCase = label.toLowerCase()

      return option.label.toLowerCase().includes(lowerCase)
    },
    [label, onConditionallyShowOption],
  )

  const filteredOptions = useFormElementOptions({
    element,
    value,
    onChange,
    onFilter,
  })

  const handleSearch = React.useCallback(async () => {
    return filteredOptions
  }, [filteredOptions])

  // Ensure the label matches the value selected
  React.useEffect(() => {
    if (!Array.isArray(element.options)) {
      return
    }

    const option = element.options.find((option) => option.value === value)
    if (option && label !== option.label) {
      setLabel(option.label)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element.options, value])

  return (
    <div className="cypress-autocomplete-filter-element">
      <FormElementLabelContainer
        className="ob-autocomplete"
        element={element}
        id={id}
        required={element.required}
      >
        <FormElementOptions options={element.options}>
          <AutocompleteDropdown
            id={id}
            label={label}
            disabled={element.readOnly}
            placeholder={element.placeholderValue}
            required={element.required}
            value={value}
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            onChangeValue={onChange}
            onChangeLabel={setLabel}
            onSearch={handleSearch}
            searchDebounceMs={0}
            searchMinCharacters={0}
          />
        </FormElementOptions>
      </FormElementLabelContainer>
    </div>
  )
})

const AutocompleteFetch = React.memo(function AutocompleteFetch({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  searchUrl,
}: AutocompleteFetchProps) {
  const [label, setLabel] = React.useState('')

  const handleSearch = React.useCallback(
    async (search, abortSignal) => {
      const headers = await generateHeaders()
      const response = await fetch(`${searchUrl}?value=${search}`, {
        headers,
        signal: abortSignal,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text)
      }

      return await response.json()
    },
    [searchUrl],
  )

  // Ensure the label is set if the value is set outside of this component
  React.useEffect(() => {
    if (!label && typeof value === 'string') {
      setLabel(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="cypress-autocomplete-search-element">
      <FormElementLabelContainer
        className="ob-autocomplete"
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
          onChangeValue={onChange}
          onChangeLabel={setLabel}
          searchDebounceMs={750}
          searchMinCharacters={1}
          onSearch={handleSearch}
        />
      </FormElementLabelContainer>
    </div>
  )
})

function FormElementAutocomplete({
  onConditionallyShowOption,
  onChange,
  ...props
}: Props) {
  const handleChange = React.useCallback(
    (newValue) => {
      onChange(props.element, newValue)
    },
    [onChange, props.element],
  )
  if (props.element.optionsType === 'SEARCH' && props.element.searchUrl) {
    return (
      <AutocompleteFetch
        {...props}
        onChange={handleChange}
        searchUrl={props.element.searchUrl}
      />
    )
  }

  return (
    <AutocompleteFilter
      {...props}
      onChange={handleChange}
      onConditionallyShowOption={onConditionallyShowOption}
    />
  )
}

export default React.memo(FormElementAutocomplete)
