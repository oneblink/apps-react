import * as React from 'react'
import { localisationService } from '@oneblink/apps'

import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import useFlatpickr, { FlatpickrOptions } from '../hooks/useFlatpickr'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { parseDateValue } from '../services/generate-default-data'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import useFormElementDateFromTo from '../hooks/useFormElementDateFromTo'
import { LookupNotificationContext } from '../hooks/useLookupNotification'

type Props = {
  id: string
  element: FormTypes.DateTimeElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

function FormElementDateTime({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
}: Props) {
  const htmlDivElementRef = React.useRef<HTMLDivElement>(null)

  const { fromDate, fromDaysOffset, toDate, toDaysOffset } =
    useFormElementDateFromTo(element)

  const flatpickrOptions = React.useMemo(() => {
    const opts: FlatpickrOptions = {
      altInput: true,
      dateFormat: 'Y-m-dTH:i:S',
      altFormat: localisationService.getFlatpickrFormats().shortDateTime,
      allowInput: false,
      altInputClass: 'input ob-input cypress-date-time-control',
      minDate: parseDateValue({
        dateOnly: false,
        daysOffset: fromDaysOffset,
        value: fromDate,
      }),
      maxDate: parseDateValue({
        dateOnly: false,
        daysOffset: toDaysOffset,
        value: toDate,
      }),
      defaultDate: undefined,
      enableTime: true,
      allowInvalidPreload: true,
      onClose: setIsDirty,
    }

    return opts
  }, [fromDate, fromDaysOffset, setIsDirty, toDate, toDaysOffset])

  const handleChange = React.useCallback(
    (newValue: string | undefined) =>
      onChange(element, {
        value: newValue,
      }),
    [element, onChange],
  )

  useFlatpickr(
    {
      id,
      value,
      onChange: handleChange,
      label: element.label,
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

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp

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
                className="button is-input-addon copy-button cypress-copy-to-clipboard-button"
                text={text}
              />
            </div>
          )}
          <LookupButton
            isInputButton
            value={value}
            validationMessage={validationMessage}
            lookupButtonConfig={element.lookupButton}
          />
        </div>

        {isDisplayingValidationMessage && (
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
