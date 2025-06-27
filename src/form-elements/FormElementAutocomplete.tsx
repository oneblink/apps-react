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
  IsDirtyProps,
  UpdateFormElementsHandler,
} from '../types/form'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'

type _BaseProps = {
  id: string
  element: FormTypes.AutoCompleteElement
  value: unknown | undefined
  displayValidationMessage: boolean
  validationMessage: string | undefined
  onUpdateFormElements: UpdateFormElementsHandler
  autocompleteAttributes?: string
} & IsDirtyProps

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
  searchQuerystringParameter: string
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
  onUpdateFormElements,
  isDirty,
  setIsDirty,
  autocompleteAttributes,
}: AutocompleteFilterProps) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const [label, setLabel] = React.useState('')

  const onFilter = React.useCallback(
    (option: FormTypes.ChoiceElementOption) => {
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
    onUpdateFormElements,
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
            isDirty={isDirty}
            setIsDirty={setIsDirty}
            aria-describedby={ariaDescribedby}
            autoComplete={autocompleteAttributes}
            aria-required={element.required}
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
  searchQuerystringParameter,
  isDirty,
  setIsDirty,
  autocompleteAttributes,
}: AutocompleteFetchProps) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const [label, setLabel] = React.useState('')

  const handleSearch = React.useCallback(
    async (search: string, abortSignal: AbortSignal) => {
      const headers = await generateHeaders()
      const url = new URL(searchUrl)
      url.searchParams.append(searchQuerystringParameter, search)
      const response = await fetch(url.href, {
        headers,
        signal: abortSignal,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text)
      }

      const data = await response.json()
      return formElementsService.parseDynamicFormElementOptions(data)
    },
    [searchQuerystringParameter, searchUrl],
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
          isDirty={isDirty}
          setIsDirty={setIsDirty}
          aria-describedby={ariaDescribedby}
          autoComplete={autocompleteAttributes}
          aria-required={element.required}
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
    (newValue: unknown) => {
      onChange(props.element, {
        value: newValue as string | undefined,
      })
    },
    [onChange, props.element],
  )
  if (props.element.optionsType === 'SEARCH' && props.element.searchUrl) {
    return (
      <AutocompleteFetch
        {...props}
        onChange={handleChange}
        searchUrl={props.element.searchUrl}
        searchQuerystringParameter={
          props.element.searchQuerystringParameter || 'value'
        }
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
