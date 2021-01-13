import * as React from 'react'
import AbortController from 'abort-controller'
// import { generateHeaders as generateFetchHeaders } from '@oneblink/apps/dist/services/fetch'
import { authService } from '@oneblink/apps'

import FormElementOptions from '../components/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import useBooleanState from '../hooks/useBooleanState'
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
  const [
    isAutocompleteOpen,
    openAutocomplete,
    closeAutocomplete,
  ] = useBooleanState(false)

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

  // Ensure the label matches the value selected
  React.useEffect(() => {
    if (!Array.isArray(element.options)) {
      return
    }

    if (!value && label) {
      setLabel('')
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
      >
        <FormElementOptions options={element.options}>
          <AutocompleteDropdown
            id={id}
            label={label}
            disabled={element.readOnly}
            placeholder={element.placeholderValue}
            required={element.required}
            value={value}
            options={filteredOptions}
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            isOpen={isAutocompleteOpen}
            onOpen={openAutocomplete}
            onClose={closeAutocomplete}
            onChangeValue={onChange}
            onChangeLabel={setLabel}
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
  const [, setError] = React.useState(null)
  const [
    isAutocompleteOpen,
    openAutocomplete,
    closeAutocomplete,
  ] = useBooleanState(false)
  const [isFetchingOptions, setIsFetchingOptions] = React.useState(false)
  const [options, setOptions] = React.useState(null)

  React.useEffect(() => {
    if (!label || !isAutocompleteOpen) {
      setIsFetchingOptions(false)
      return
    }

    setIsFetchingOptions(true)

    let ignore = false
    const abortController = new AbortController()

    const timeoutId = setTimeout(async () => {
      let newOptions = []
      let newError = null

      try {
        let headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }
        // Check auth service for a token if user is logged in
        const idToken = await authService.getIdToken()
        if (idToken) {
          headers = {
            ...headers,
            Authorization: `Bearer ${idToken}`,
          }
        }

        const userToken = authService.getUserToken()
        if (userToken) {
          headers['X-OneBlink-User-Token'] = userToken
        }

        const response = await fetch(`${searchUrl}?value=${label}`, {
          headers,
          signal: abortController.signal,
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(text)
        }

        newOptions = await response.json()
      } catch (error) {
        console.warn('Error while fetching autocomplete options', error)
        // Cancelling will throw an error.
        if (error.name !== 'AbortError') {
          newError = error
        }
      }
      if (!ignore) {
        setError(newError)
        setOptions(newOptions)
        setIsFetchingOptions(false)
      }
    }, 750)

    return () => {
      ignore = true
      clearTimeout(timeoutId)
      abortController.abort()
    }
  }, [isAutocompleteOpen, label, searchUrl])

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
      >
        <AutocompleteDropdown
          id={id}
          label={label}
          isFetchingOptions={isFetchingOptions}
          disabled={element.readOnly}
          placeholder={element.placeholderValue}
          required={element.required}
          value={value}
          options={options}
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
          isOpen={isAutocompleteOpen}
          onOpen={openAutocomplete}
          onClose={closeAutocomplete}
          onChangeValue={onChange}
          onChangeLabel={setLabel}
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
