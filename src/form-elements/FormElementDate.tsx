import * as React from 'react'
import { localisationService } from '@oneblink/apps'

import CopyToClipboardButton from '../components/CopyToClipboardButton'
import useFlatpickr, { FlatpickrOptions } from '../hooks/useFlatpickr'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/FormElementLabelContainer'

type Props = {
  id: string
  element: FormTypes.DateElement
  value: unknown | undefined
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: string | undefined,
  ) => void
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementDate({
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
      dateFormat: 'Y-m-d',
      altFormat: localisationService.flatpickrDateFormat,
      allowInput: true,
      altInputClass: 'input ob-input cypress-date-control',
      minDate: undefined,
      maxDate: undefined,
      defaultDate: undefined,
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
      onChange: handleChange,
    },
    flatpickrOptions,
    htmlDivElementRef,
  )

  const text = React.useMemo(() => {
    if (typeof value !== 'string') {
      return null
    }
    return localisationService.formatDate(new Date(value))
  }, [value])

  return (
    <div className="cypress-date-element" ref={htmlDivElementRef}>
      <FormElementLabelContainer className="ob-date" id={id} element={element}>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              type="date"
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
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementDate)
