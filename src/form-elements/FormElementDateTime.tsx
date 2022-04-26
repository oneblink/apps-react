import * as React from 'react'
import { localisationService } from '@oneblink/apps'

import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import useFlatpickr, { FlatpickrOptions } from '../hooks/useFlatpickr'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { parseDateValue } from '../services/generate-default-data'
import { FormElementValueChangeHandler } from '../types/form'

type Props = {
  id: string
  element: FormTypes.DateTimeElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementDateTime({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const htmlDivElementRef = React.useRef<HTMLDivElement>(null)

  const [isDirty, setIsDirty] = useBooleanState(false)

  const flatpickrOptions = React.useMemo(() => {
    const opts: FlatpickrOptions = {
      altInput: true,
      dateFormat: 'Y-m-dTH:i:S',
      altFormat: localisationService.getFlatpickrFormats().shortDateTime,
      allowInput: false,
      altInputClass: 'input ob-input cypress-date-time-control',
      minDate: parseDateValue({
        dateOnly: false,
        daysOffset: element.fromDateDaysOffset,
        value: element.fromDate,
      }),
      maxDate: parseDateValue({
        dateOnly: false,
        daysOffset: element.toDateDaysOffset,
        value: element.toDate,
      }),
      defaultDate: undefined,
      enableTime: true,
      allowInvalidPreload: true,
      onClose: setIsDirty,
    }

    return opts
  }, [
    element.fromDate,
    element.fromDateDaysOffset,
    element.toDate,
    element.toDateDaysOffset,
    setIsDirty,
  ])

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
    htmlDivElementRef,
  )

  const text = React.useMemo(() => {
    if (typeof value !== 'string') {
      return null
    }
    return localisationService.formatDatetime(new Date(value))
  }, [value])

  return (
    <div className="cypress-datetime-element" ref={htmlDivElementRef}>
      <FormElementLabelContainer
        className="ob-datetime"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="field has-addons">
          <div className="control is-expanded has-icons-right">
            <input
              type="datetime-local"
              id={id}
              name={element.name}
              placeholder={element.placeholderValue}
              disabled={element.readOnly}
              className="input ob-input"
            />
            <span className="ob-input-icon icon is-small is-right">
              <i className="material-icons is-size-5">date_range</i>
            </span>
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
          <div role="alert" className="has-margin-top-8">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementDateTime)
