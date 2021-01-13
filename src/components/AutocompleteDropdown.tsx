import * as React from 'react'
import clsx from 'clsx'

import { FormTypes } from '@oneblink/types'

type Props = {
  id: string
  label: string
  value: unknown | undefined
  placeholder: string | undefined
  required: boolean | undefined
  disabled: boolean | undefined
  options: FormTypes.ChoiceElementOption[] | null
  validationMessage: string | undefined
  displayValidationMessage: boolean
  isFetchingOptions?: boolean
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onChangeValue: (newValue: string | undefined) => void
  onChangeLabel: (newLabel: string) => void
}

function AutocompleteDropdown({
  id,
  label,
  value,
  options,
  placeholder,
  required,
  disabled,
  validationMessage,
  displayValidationMessage,
  isFetchingOptions,
  isOpen,
  onOpen,
  onClose,
  onChangeValue,
  onChangeLabel,
}: Props) {
  const optionsContainerElement = React.useRef<HTMLDivElement>(null)
  const [isDirty, setIsDirty] = React.useState(false)
  const [
    currentFocusedOptionIndex,
    setCurrentFocusedOptionIndex,
  ] = React.useState(0)

  const onSelectOption = React.useCallback(
    (option) => {
      onChangeLabel(option.label)
      onChangeValue(option.value)
      onClose()
    },
    [onChangeLabel, onChangeValue, onClose],
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
      onChangeValue(undefined)
      onChangeLabel(newLabel)
    },
    [onChangeLabel, onChangeValue, onOpen],
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
              placeholder={placeholder}
              id={id}
              autoComplete="off"
              className="cypress-autocomplete-control input ob-input"
              required={required}
              value={label}
              disabled={disabled}
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
}

export default React.memo(AutocompleteDropdown)

function highlightLabel(text: string, phrase: string) {
  if (phrase) {
    text = text.replace(new RegExp('(' + phrase + ')', 'gi'), '<b>$1</b>')
  }

  return text
}
