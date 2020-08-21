// @flow
'use strict'

import * as React from 'react'
import clsx from 'clsx'
import { CopyToClipboardButton } from 'components'
import vocabularyService from 'services/vocabulary-service'
import useFlatpickr from 'form/hooks/useFlatpickr'
import useBooleanState from 'form/hooks/useBooleanState'
import LookupButton from 'form/components/LookupButton'

type Props = {
  id: string,
  element: DateElement,
  value: mixed | void,
  onChange: (FormElement, string | void) => void,
  displayValidationMessage: boolean,
  validationMessage: string | void,
}

function FormElementDate({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [isDirty, setIsDirty] = useBooleanState(false)

  const flatpickrOptions = React.useMemo(() => {
    const opts = {
      altInput: true,
      dateFormat: 'Y-m-d',
      altFormat: vocabularyService.flatpickrDateFormat,
      allowInput: true,
      altInputClass: 'input ob-input cypress-date-control',
      minDate: undefined,
      maxDate: undefined,
      defaultDate: undefined,
    }

    if (element.fromDate) {
      opts.minDate = element.fromDate
    }
    if (element.toDate) {
      opts.maxDate = element.toDate
    }

    return opts
  }, [element])

  const handleChange = React.useCallback(
    (newValue) => onChange(element, newValue),
    [element, onChange],
  )

  useFlatpickr(
    {
      id,
      value,
      isDisabled: element.readOnly,
      onBlur: setIsDirty,
      onChange: handleChange,
    },
    flatpickrOptions,
  )

  const text = React.useMemo(() => {
    if (typeof value !== 'string') {
      return null
    }
    return vocabularyService.formatDate(new Date(value))
  }, [value])

  return (
    <div className="cypress-date-element">
      <div className="ob-form__element ob-date">
        <label
          className={clsx('label ob-label', {
            'is-required': element.required,
          })}
          htmlFor={id}
        >
          {element.label}
        </label>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              type="date"
              id={id}
              name={element.name}
              placeholder={element.placeholderValue}
              className="input ob-input"
            />
          </div>
          {!!element.readOnly && !!text && (
            <div className="control">
              <CopyToClipboardButton
                className="button is-input-addon cypress-copy-to-clipboard-button"
                isInputButton
                text={text}
              />
            </div>
          )}
          <LookupButton
            isInputButton
            value={value}
            validationMessage={validationMessage}
          />
        </div>

        {(isDirty || displayValidationMessage) && !!validationMessage && (
          <div role="alert">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo<Props>(FormElementDate)
