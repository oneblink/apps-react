// @flow
'use strict'

import * as React from 'react'
import AbortController from 'abort-controller'
import clsx from 'clsx'

import FormElementOptions from '../components/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import useBooleanState from '../hooks/useBooleanState'
import { authService } from '@oneblink/apps'

/* ::
type BaseProps = {
  id: string,
  element: AutoCompleteElement,
  value: mixed | void,
  onChange: (FormElement, mixed | void) => void,
  displayValidationMessage: boolean,
  validationMessage: string | void,
}

type AutocompleteFilterProps = BaseProps & {
  onConditionallyShowOption: (ChoiceElementOption) => boolean,
}
*/

const AutocompleteFilter = React.memo(function AutocompleteFilter(
  {
    id,
    element,
    value,
    onChange,
    onConditionallyShowOption,
    validationMessage,
    displayValidationMessage,
  } /* : AutocompleteFilterProps */,
) {
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
    <AutocompleteContainer
      className="cypress-autocomplete-filter-element"
      element={element}
      id={id}
    >
      <FormElementOptions options={element.options}>
        <AutocompleteDropdown
          id={id}
          label={label}
          element={element}
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
    </AutocompleteContainer>
  )
})

const AutocompleteFetch = React.memo(function AutocompleteFetch(
  {
    id,
    element,
    value,
    onChange,
    validationMessage,
    displayValidationMessage,
    searchUrl,
  } /* : BaseProps & {
  searchUrl: string,
} */,
) {
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
        let headers = {
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
    <AutocompleteContainer
      className="cypress-autocomplete-search-element"
      element={element}
      id={id}
    >
      <AutocompleteDropdown
        id={id}
        label={label}
        isFetchingOptions={isFetchingOptions}
        element={element}
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
    </AutocompleteContainer>
  )
})

const AutocompleteDropdown = React.memo(function AutocompleteDropdown(
  {
    id,
    label,
    element,
    value,
    options,
    validationMessage,
    displayValidationMessage,
    isFetchingOptions,
    isOpen,
    onOpen,
    onClose,
    onChangeValue,
    onChangeLabel,
  } /* : {
  id: string,
  label: string,
  element: AutoCompleteElement,
  value: mixed | void,
  options: ChoiceElementOption[] | null,
  validationMessage: string | void,
  displayValidationMessage: boolean,
  isFetchingOptions?: boolean,
  isOpen: boolean,
  onOpen: () => void,
  onClose: () => void,
  onChangeValue: (FormElement, string | void) => void,
  onChangeLabel: (string) => void,
} */,
) {
  const optionsContainerElement = React.useRef(null)
  const [isDirty, setIsDirty] = React.useState(false)
  const [
    currentFocusedOptionIndex,
    setCurrentFocusedOptionIndex,
  ] = React.useState(0)

  const onSelectOption = React.useCallback(
    (option) => {
      onChangeLabel(option.label)
      onChangeValue(element, option.value)
      onClose()
    },
    [element, onChangeLabel, onChangeValue, onClose],
  )

  const handleClickOption = React.useCallback(
    (event, option) => {
      console.log('Selected element option in autocomplete', option)

      event.preventDefault()
      event.stopPropagation()

      onSelectOption(option)
    },
    [onSelectOption],
  )

  const onFocus = React.useCallback(() => {
    setCurrentFocusedOptionIndex(0)
    onOpen()
  }, [onOpen])

  // When moving away from the input, if this is no value remove
  // the label to show the user they have not selected a value
  const handleBlur = React.useCallback(() => {
    setIsDirty(true)
    onClose()

    if (!value && Array.isArray(options)) {
      // If there is no option currently selected but the typed in label
      // matches an option's label, set that option as the value, otherwise remove label
      if (label) {
        const lowerCase = label.toLowerCase()
        const option = options.find(
          (option) => option.label.toLowerCase() === lowerCase,
        )
        if (option) {
          console.log('Setting value after blurring away from autocomplete')
          onSelectOption(option)
          return
        }
      }
      console.log('Removing label after blurring away from autocomplete')
      onChangeLabel('')
    }
  }, [label, onChangeLabel, onClose, onSelectOption, options, value])

  const onKeyDown = React.useCallback(
    (event) => {
      if (!options) {
        return
      }
      const enterPressed = event.keyCode === 13
      const upArrowPressed = event.keyCode === 38
      const downArrowPressed = event.keyCode === 40
      if (!upArrowPressed && !downArrowPressed && !enterPressed) {
        return
      }

      event.preventDefault()

      const previousFocusedOptionIndex = currentFocusedOptionIndex
      let nextFocusedOptionIndex = currentFocusedOptionIndex
      if (upArrowPressed) {
        nextFocusedOptionIndex = Math.max(0, currentFocusedOptionIndex - 1)
      } else if (downArrowPressed) {
        nextFocusedOptionIndex = Math.min(
          options.length - 1,
          currentFocusedOptionIndex + 1,
        )
      } else if (enterPressed) {
        const option = options[nextFocusedOptionIndex]
        if (option) {
          onSelectOption(option)
        }
      }

      // If the index has changed, need to ensure the active option is visible
      if (
        previousFocusedOptionIndex !== nextFocusedOptionIndex &&
        optionsContainerElement.current
      ) {
        const activeStepElement = optionsContainerElement.current.querySelector(
          `.ob-autocomplete__drop-down-item-${nextFocusedOptionIndex}`,
        )
        if (activeStepElement) {
          activeStepElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'start',
          })
        }
        setCurrentFocusedOptionIndex(nextFocusedOptionIndex)
      }
    },
    [currentFocusedOptionIndex, options, onSelectOption],
  )

  const handleChangeLabel = React.useCallback(
    (e) => {
      const newLabel = e.target.value
      onOpen()
      setCurrentFocusedOptionIndex(0)

      // Remove value when changing label
      onChangeValue(element, undefined)
      onChangeLabel(newLabel)
    },
    [element, onChangeLabel, onChangeValue, onOpen],
  )

  return (
    <>
      <div
        className={clsx('dropdown', {
          'is-active': isOpen && Array.isArray(options),
        })}
      >
        <div className="field">
          <div
            className={clsx(
              'cypress-autocomplete-field-control control is-expanded',
              {
                'is-loading': isFetchingOptions,
              },
            )}
          >
            <input
              type="text"
              placeholder={element.placeholderValue}
              id={id}
              autoComplete="off"
              className="cypress-autocomplete-control input ob-input"
              required={element.required}
              value={label}
              disabled={element.readOnly}
              onFocus={onFocus}
              onBlur={handleBlur}
              onKeyDown={onKeyDown}
              onChange={handleChangeLabel}
            />
          </div>
        </div>

        <div className="dropdown-menu">
          <div
            ref={optionsContainerElement}
            className="ob-autocomplete__dropdown-content dropdown-content cypress-autocomplete-dropdown-content"
          >
            {options && options.length ? (
              options.map((option, index) => (
                <a
                  key={option.value}
                  className={clsx(
                    `dropdown-item cypress-autocomplete-dropdown-item ob-autocomplete__drop-down-item-${index}`,
                    {
                      'is-active': currentFocusedOptionIndex === index,
                    },
                  )}
                  onMouseDown={(e) => handleClickOption(e, option)}
                  dangerouslySetInnerHTML={{
                    __html: highlightLabel(option.label, label),
                  }}
                />
              ))
            ) : (
              <a className="dropdown-item cypress-no-matches-found ob-autocomplete__drop-down-item-no-matches">
                <i>No matches found</i>
              </a>
            )}
          </div>
        </div>
      </div>

      {(isDirty || displayValidationMessage) && !!validationMessage && (
        <div role="alert">
          <div className="has-text-danger ob-error__text cypress-validation-message">
            {validationMessage}
          </div>
        </div>
      )}
    </>
  )
})

function highlightLabel(text, phrase) {
  if (phrase) {
    text = text.replace(new RegExp('(' + phrase + ')', 'gi'), '<b>$1</b>')
  }

  return text
}

const AutocompleteContainer = React.memo(function AutocompleteContainer(
  {
    className,
    element,
    id,
    children,
  } /* : {
  className: string,
  element: AutoCompleteElement,
  id: string,
  children: React.Node,
} */,
) {
  return (
    <div className={className}>
      <div className="ob-form__element ob-autocomplete">
        <label
          className={clsx('label ob-label', {
            'is-required': element.required,
          })}
          htmlFor={id}
        >
          {element.label}
        </label>
        {children}
      </div>
    </div>
  )
})

function FormElementAutocomplete(
  { onConditionallyShowOption, ...props } /* : AutocompleteFilterProps */,
) {
  if (props.element.optionsType === 'SEARCH' && props.element.searchUrl) {
    return <AutocompleteFetch {...props} searchUrl={props.element.searchUrl} />
  }

  return (
    <AutocompleteFilter
      {...props}
      onConditionallyShowOption={onConditionallyShowOption}
    />
  )
}

export default (React.memo(
  FormElementAutocomplete,
) /*: React.AbstractComponent<AutocompleteFilterProps> */)
