import * as React from 'react'
import { formElementsService } from '@oneblink/sdk-core'
import { generateHeaders } from '@oneblink/apps/dist/services/fetch'

import FormElementOptions from '../components/renderer/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import AutocompleteDropdown from '../components/renderer/AutocompleteDropdown'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormTypes } from '@oneblink/types'
import {
  FormElementValueChangeHandler,
  FormElementConditionallyShownElement,
} from '../types/form'

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
  conditionallyShownOptionsElement:
    | FormElementConditionallyShownElement
    | undefined
}

type AutocompleteFilterProps = _AutocompleteChangeHandlerProps &
  _AutocompleteConditionallyShowOptionProps

type AutocompleteFetchProps = _AutocompleteChangeHandlerProps & {
  searchUrl: string
}

type Props = _BaseProps &
  _AutocompleteConditionallyShowOptionProps & {
    onChange: FormElementValueChangeHandler<string>
  }

const AutocompleteFilter = React.memo(function AutocompleteFilter({
  id,
  element,
  value,
  onChange,
  conditionallyShownOptionsElement,
  validationMessage,
  displayValidationMessage,
}: AutocompleteFilterProps) {
  const [label, setLabel] = React.useState('')

  const onFilter = React.useCallback(
    (option) => {
      // If the user has typed nothing in, display all options
      if (!label) {
        return true
      }

      const lowerCase = label.toLowerCase()

      return option.label.toLowerCase().includes(lowerCase)
    },
    [label],
  )

  const handleChange = React.useCallback(
    //useFormElementOptions expects the first arg to be the element
    (element: FormTypes.FormElement, newValue: unknown) => onChange(newValue),
    [onChange],
  )

  const filteredOptions = useFormElementOptions({
    element,
    value,
    onChange: handleChange,
    conditionallyShownOptionsElement,
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
        <FormElementOptions
          options={element.options}
          conditionallyShownOptionsElement={conditionallyShownOptionsElement}
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
      const url = new URL(searchUrl)
      url.searchParams.append('value', search)
      const response = await fetch(url.href, {
        headers,
        signal: abortSignal,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text)
      }

      const data = await response.json()
      return formElementsService.parseFormElementOptionsSet(data)
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
  conditionallyShownOptionsElement,
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
      conditionallyShownOptionsElement={conditionallyShownOptionsElement}
    />
  )
}

export default React.memo(FormElementAutocomplete)
