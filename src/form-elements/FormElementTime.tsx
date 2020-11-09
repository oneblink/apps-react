import * as React from 'react'
import clsx from 'clsx'
import { localisationService } from '@oneblink/apps'

import CopyToClipboardButton from '../components/CopyToClipboardButton'
import useFlatpickr, { FlatpickrOptions } from '../hooks/useFlatpickr'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/LookupButton'
import { FormTypes } from '@oneblink/types'

type Props = {
  id: string
  element: FormTypes.TimeElement
  value: unknown | undefined
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: unknown | undefined,
  ) => unknown
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementTime({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [isDirty, setIsDirty] = useBooleanState(false)

  const flatpickrOptions = React.useMemo(() => {
    const opts: FlatpickrOptions = {
      altInput: true,
      dateFormat: 'H:i',
      altFormat: localisationService.flatpickrTimeFormat,
      allowInput: false,
      altInputClass: 'input ob-input cypress-time-control',
      minDate: undefined,
      maxDate: undefined,
      defaultDate: undefined,
      enableTime: true,
      noCalendar: true,
      time_24hr: false,
      onClose: setIsDirty,
    }

    return opts
  }, [setIsDirty])

  const handleChange = React.useCallback(
    (newValue) => onChange(element, newValue),
    [element, onChange],
  )

  useFlatpickr(
    {
      id,
      value,
      onChange: handleChange,
    },
    flatpickrOptions,
  )

  const text = React.useMemo(() => {
    if (typeof value !== 'string') {
      return null
    }
    return localisationService.formatTime(new Date(value))
  }, [value])

  return (
    <div className="cypress-time-element">
      <div className="ob-form__element ob-time">
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
              type="time"
              id={id}
              name={element.name}
              placeholder={element.placeholderValue}
              disabled={element.readOnly}
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

export default React.memo(FormElementTime)
