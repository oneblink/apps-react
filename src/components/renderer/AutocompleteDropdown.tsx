import * as React from 'react'
import clsx from 'clsx'
import { Sentry } from '@oneblink/apps'

import useBooleanState from '../../hooks/useBooleanState'
import { IsDirtyProps } from '../../types/form'
import { LookupNotificationContext } from '../../hooks/useLookupNotification'

export type AutocompleteOption<T> = {
  label: string
  value: string
  data?: T
}

type Props<T> = {
  id: string
  label: string
  value: unknown | undefined
  placeholder: string | undefined
  required: boolean | undefined
  disabled: boolean | undefined
  isLoading?: boolean
  hasError?: boolean
  validationMessage: string | undefined
  displayValidationMessage: boolean
  searchDebounceMs: number
  searchMinCharacters: number
  onChangeValue: (
    newValue: string | undefined,
    data?: T,
  ) => Promise<void> | void
  onChangeLabel: (newLabel: string) => void
  onSearch: (
    label: string,
    abortSignal: AbortSignal,
  ) => Promise<AutocompleteOption<T>[]>
} & IsDirtyProps

function AutocompleteDropdown<T>({
  id,
  label,
  value,
  placeholder,
  required,
  disabled,
  validationMessage,
  displayValidationMessage,
  searchDebounceMs,
  searchMinCharacters,
  isLoading,
  hasError,
  onChangeValue,
  onChangeLabel,
  onSearch,
  isDirty,
  setIsDirty,
}: Props<T>) {
  const optionsContainerElement = React.useRef<HTMLDivElement>(null)
  const [currentFocusedOptionIndex, setCurrentFocusedOptionIndex] =
    React.useState(0)
  const [options, setOptions] = React.useState<AutocompleteOption<T>[]>([])
  const [error, setError] = React.useState<Error | null>(null)
  const [isFetchingOptions, setIsFetchingOptions] = React.useState(false)
  const [isOpen, onOpen, onClose] = useBooleanState(false)

  const onSelectOption = React.useCallback(
    (option: AutocompleteOption<T>) => {
      onChangeLabel(option.label)
      onChangeValue(option.value, option.data)
      onClose()
    },
    [onChangeLabel, onChangeValue, onClose],
  )

  const handleClickOption = React.useCallback(
    (
      event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
      option: AutocompleteOption<T>,
    ) => {
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
  const handleBlur = React.useCallback(
    (inputOption: { label: string; value: unknown | undefined }) => {
      setIsDirty()
      setError(null)
      onClose()

      if (Array.isArray(options)) {
        // If there is a label that resembles an option, set that option to be the new value.
        // UNLESS it was the previously selected label. Else, clear the label and the value.
        if (inputOption.label) {
          const lowerCase = inputOption.label.toLowerCase()
          const option = options.find(
            (option) => option.label.toLowerCase() === lowerCase,
          )
          if (option) {
            // If the new option is not equal to the option that is currently selected,
            // we want to update to the new option to ensure that it gets changed.
            if (inputOption.value !== option.value) {
              console.log('Setting value after blurring away from autocomplete')
              onSelectOption(option)
            }
            return
          }
        }

        console.log('Removing label after blurring away from autocomplete')
        onChangeValue(undefined)
        onChangeLabel('')
      }
    },
    [
      onChangeLabel,
      onChangeValue,
      onClose,
      onSelectOption,
      options,
      setIsDirty,
    ],
  )

  const onKeyDown = React.useCallback<
    React.KeyboardEventHandler<HTMLInputElement>
  >(
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

  const handleChangeLabel = React.useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >(
    (e) => {
      const newLabel = e.target.value
      onOpen()
      setCurrentFocusedOptionIndex(0)

      onChangeLabel(newLabel)
    },
    [onChangeLabel, onOpen],
  )

  React.useEffect(() => {
    setError(null)

    if (!isOpen || label.length < searchMinCharacters) {
      setIsFetchingOptions(false)
      return
    }

    setIsFetchingOptions(true)

    let ignore = false
    const abortController = new AbortController()

    const timeoutId = setTimeout(async () => {
      let newOptions: AutocompleteOption<T>[] = []
      let newError = null

      try {
        newOptions = await onSearch(label, abortController.signal)
      } catch (error) {
        // Cancelling will throw an error.
        if (!abortController.signal.aborted) {
          console.warn('Error while fetching autocomplete options', error)
          Sentry.captureException(error)
          newError = error as Error
        }
      }
      if (!ignore) {
        setError(newError)
        setOptions(newOptions)
        setIsFetchingOptions(false)
      }
    }, searchDebounceMs)

    return () => {
      ignore = true
      clearTimeout(timeoutId)
      abortController.abort()
    }
  }, [isOpen, label, onSearch, searchDebounceMs, searchMinCharacters])

  React.useEffect(() => {
    //If there is no value set, we want to clear the label
    //This is to satisfy lookups that return undefined.
    if (!value) {
      onChangeLabel('')
    }
  }, [onChangeLabel, value])
  const { isLookingUp } = React.useContext(LookupNotificationContext)

  const isShowingLoading = isFetchingOptions || !!isLoading
  const isShowingValid = !isShowingLoading && value !== undefined
  const isShowingError = !isShowingLoading && !isLookingUp && !!hasError

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
                'is-loading': isShowingLoading,
                'has-icons-right': isShowingValid || isShowingError,
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
              onBlur={() => handleBlur({ label, value })}
              onKeyDown={onKeyDown}
              onChange={handleChangeLabel}
            />
            {isShowingValid && (
              <span className=" ob-input-icon icon is-small is-right">
                <i className="material-icons is-size-5 has-text-success">
                  check
                </i>
              </span>
            )}
            {isShowingError && (
              <span className=" ob-input-icon icon is-small is-right">
                <i className="material-icons is-size-5 has-text-danger">
                  error
                </i>
              </span>
            )}
          </div>
        </div>

        <div className="dropdown-menu">
          <div
            ref={optionsContainerElement}
            className="ob-autocomplete__dropdown-content dropdown-content cypress-autocomplete-dropdown-content"
          >
            {error ? (
              <a className="dropdown-item cypress-autocomplete-error ob-autocomplete__drop-down-item-error">
                <span className="has-text-danger">{error.message}</span>
              </a>
            ) : label.length < searchMinCharacters ? (
              <a className="dropdown-item cypress-max-characters ob-autocomplete__drop-down-item-max-characters">
                <i>
                  Enter at least {searchMinCharacters} character(s) to search
                </i>
              </a>
            ) : isShowingLoading ? (
              <a className="dropdown-item cypress-searching-options ob-autocomplete__drop-down-item-searching">
                <i>Searching...</i>
              </a>
            ) : options && options.length ? (
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
                  // eslint-disable-next-line react/no-danger
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

      {(isDirty || displayValidationMessage) &&
        !!validationMessage &&
        !isShowingLoading && (
          <div role="alert" className="has-margin-top-8">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
    </>
  )
}

export default React.memo(AutocompleteDropdown) as typeof AutocompleteDropdown

function highlightLabel(text: string, phrase: string) {
  if (phrase) {
    text = text.replace(
      new RegExp(
        '(' +
          phrase.replace(
            /[`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/gi,
            (char: string) => `\\${char}`,
          ) +
          ')',
        'gi',
      ),
      '<b>$1</b>',
    )
  }

  return text
}
