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
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import MaterialIcon from '../components/MaterialIcon'

type Props = {
  id: string
  element: FormTypes.DateElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

function FormElementDate({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const htmlDivElementRef = React.useRef<HTMLDivElement>(null)

  const { fromDate, fromDaysOffset, toDate, toDaysOffset } =
    useFormElementDateFromTo(element)

  const flatpickrOptions = React.useMemo(() => {
    const opts: FlatpickrOptions = {
      dateFormat: localisationService.getFlatpickrFormats().shortDate,
      allowInput: true,
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

  const { onBlur } = useFlatpickr(
    {
      id,
      value,
      onChange: handleChange,
      dateOnly: true,
    },
    flatpickrOptions,
    htmlDivElementRef,
  )

  const text = React.useMemo(() => {
    if (typeof value === 'string') {
      const date = localisationService.generateDate({
        daysOffset: undefined,
        value,
        dateOnly: true,
      })
      if (date) {
        return localisationService.formatDate(date)
      }
    }
    return null
  }, [value])

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (displayValidationMessage || isDirty) && !!validationMessage && !isLookingUp

  return (
    <div className="cypress-date-element" ref={htmlDivElementRef}>
      <FormElementLabelContainer
        className="ob-date"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="field has-addons">
          <div className="control is-expanded has-icons-right">
            <input
              id={id}
              name={element.name}
              placeholder={element.placeholderValue}
              disabled={element.readOnly}
              className="input ob-input cypress-date-control"
              onBlur={onBlur}
              autoComplete={element.autocompleteAttributes?.join(' ')}
              aria-describedby={ariaDescribedby}
            />

            <span className="ob-input-icon icon is-small is-right">
              <MaterialIcon className="is-size-5">event</MaterialIcon>
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

export default React.memo(FormElementDate)
