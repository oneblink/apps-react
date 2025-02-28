import * as React from 'react'
import { localisationService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import { parse, format } from 'date-fns'

import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import MaterialIcon from '../components/MaterialIcon'

import { parseDateValue } from '../services/generate-default-data'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import useFormElementDateFromTo from '../hooks/useFormElementDateFromTo'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'

const datetimeFormat = "yyyy-MM-dd'T'HH:mm"

type Props = {
  id: string
  element: FormTypes.DateTimeElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  autocompleteAttributes?: string
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
  autocompleteAttributes,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)

  const { fromDate, fromDaysOffset, toDate, toDaysOffset } =
    useFormElementDateFromTo(element)

  const handleChange = React.useCallback(
    (newValue: string | undefined) => {
      if (newValue) {
        try {
          const datetimeValue = parse(newValue, datetimeFormat, new Date())
          onChange(element, { value: datetimeValue.toISOString() })
          return
        } catch {
          console.warn(`Error parsing time for element: ${element.id}`)
        }
      }

      onChange(element, {
        value: undefined,
      })
      setIsDirty()
    },
    [element, onChange, setIsDirty],
  )

  const maxDatetime = React.useMemo(() => {
    return parseDateValue({
      dateFormat: datetimeFormat,
      daysOffset: toDaysOffset,
      value: toDate,
    })
  }, [toDate, toDaysOffset])

  const minDatetime = React.useMemo(() => {
    return parseDateValue({
      dateFormat: datetimeFormat,
      daysOffset: fromDaysOffset,
      value: fromDate,
    })
  }, [fromDate, fromDaysOffset])

  const datetimeValue = React.useMemo(() => {
    if (typeof value !== 'string') {
      return ''
    }
    const date = new Date(value)
    return format(date, "yyyy-MM-dd'T'HH:mm")
  }, [value])

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
    <div className="cypress-datetime-element">
      <FormElementLabelContainer
        className="ob-datetime"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="field has-addons">
          <div className="control is-expanded has-icons-right">
            <input
              id={id}
              type="datetime-local"
              name={element.name}
              value={datetimeValue}
              placeholder={element.placeholderValue}
              disabled={element.readOnly}
              className="input ob-input cypress-date-time-control"
              onBlur={setIsDirty}
              autoComplete={autocompleteAttributes}
              aria-describedby={ariaDescribedby}
              min={minDatetime}
              max={maxDatetime}
              onChange={(e) => {
                handleChange(e.target.value)
              }}
            />
            <span className="ob-input-icon icon is-small is-right">
              <MaterialIcon className="is-size-5">date_range</MaterialIcon>
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
