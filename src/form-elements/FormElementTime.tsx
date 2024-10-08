import * as React from 'react'
import { localisationService } from '@oneblink/apps'

import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import useFlatpickr, { FlatpickrOptions } from '../hooks/useFlatpickr'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import MaterialIcon from '../components/MaterialIcon'

type Props = {
  id: string
  element: FormTypes.TimeElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  autocompleteAttributes?: string
} & IsDirtyProps

function FormElementTime({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
  autocompleteAttributes,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const htmlDivElementRef = React.useRef<HTMLDivElement>(null)

  const flatpickrOptions = React.useMemo(() => {
    const opts: FlatpickrOptions = {
      altInput: true,
      dateFormat: 'H:i',
      altFormat: localisationService.getFlatpickrFormats().time,
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
    return localisationService.formatTime(new Date(value))
  }, [value])

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp
  return (
    <div className="cypress-time-element" ref={htmlDivElementRef}>
      <FormElementLabelContainer
        className="ob-time"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="field has-addons">
          <div className="control is-expanded has-icons-right">
            <input
              type="time"
              id={id}
              name={element.name}
              placeholder={element.placeholderValue}
              disabled={element.readOnly}
              className="input ob-input"
              aria-describedby={ariaDescribedby}
              autoComplete={autocompleteAttributes}
            />
            <span className="ob-input-icon icon is-small is-right">
              <MaterialIcon className="is-size-5">schedule</MaterialIcon>
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

export default React.memo(FormElementTime)
