// @flow
'use strict'

import * as React from 'react'
import clsx from 'clsx'
import { localisationService } from '@oneblink/apps'

import CopyToClipboardButton from '../components/CopyToClipboardButton'
import useFlatpickr from '../hooks/useFlatpickr'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/LookupButton'

/* ::
type Props = {
  id: string,
  element: DateTimeElement,
  value: mixed | void,
  onChange: (FormElement, string | void) => void,
  displayValidationMessage: boolean,
  validationMessage: string | void,
}
*/

function FormElementDateTime(
  {
    id,
    element,
    value,
    onChange,
    validationMessage,
    displayValidationMessage,
  } /* : Props */,
) {
  const [isDirty, setIsDirty] = useBooleanState(false)

  const flatpickrOptions = React.useMemo(() => {
    const opts = {
      altInput: true,
      dateFormat: 'Y-m-dTH:i:S',
      altFormat: localisationService.flatpickrDatetimeFormat,
      allowInput: false,
      altInputClass: 'input ob-input cypress-date-time-control',
      minDate: undefined,
      maxDate: undefined,
      defaultDate: undefined,
      enableTime: true,
      allowInvalidPreload: true,
      onClose: setIsDirty,
    }

    if (element.fromDate) {
      opts.minDate = element.fromDate
    }
    if (element.toDate) {
      opts.maxDate = element.toDate
    }

    return opts
  }, [element.fromDate, element.toDate, setIsDirty])

  const handleChange = React.useCallback(
    (newValue) => onChange(element, newValue),
    [element, onChange],
  )

  useFlatpickr(
    {
      id,
      value,
      onBlur: setIsDirty,
      onChange: handleChange,
    },
    flatpickrOptions,
  )

  const text = React.useMemo(() => {
    if (typeof value !== 'string') {
      return null
    }
    return localisationService.formatDatetime(new Date(value))
  }, [value])

  return (
    <div className="cypress-datetime-element">
      <div className="ob-form__element ob-datetime">
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
              type="datetime-local"
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

export default (React.memo(
  FormElementDateTime,
) /*: React.AbstractComponent<Props> */)
