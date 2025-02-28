import * as React from 'react'
import { localisationService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import { format } from 'date-fns'

import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import MaterialIcon from '../components/MaterialIcon'

import {
  parseDateValue,
  DATE_ELEMENT_SUBMISSION_MODEL_FORMAT,
} from '../services/generate-default-data'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import useFormElementDateFromTo from '../hooks/useFormElementDateFromTo'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'

type Props = {
  id: string
  element: FormTypes.DateElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  autocompleteAttributes?: string
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
  autocompleteAttributes,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)

  const { fromDate, fromDaysOffset, toDate, toDaysOffset } =
    useFormElementDateFromTo(element)

  const handleChange = React.useCallback(
    (newValue: string | undefined) => {
      onChange(element, {
        value: newValue
          ? format(new Date(newValue), DATE_ELEMENT_SUBMISSION_MODEL_FORMAT)
          : undefined,
      })
      setIsDirty()
    },

    [element, onChange, setIsDirty],
  )

  const maxDate = React.useMemo(() => {
    return parseDateValue({
      dateFormat: DATE_ELEMENT_SUBMISSION_MODEL_FORMAT,
      daysOffset: toDaysOffset,
      value: toDate,
    })
  }, [toDate, toDaysOffset])

  const minDate = React.useMemo(() => {
    return parseDateValue({
      dateFormat: DATE_ELEMENT_SUBMISSION_MODEL_FORMAT,
      daysOffset: fromDaysOffset,
      value: fromDate,
    })
  }, [fromDate, fromDaysOffset])

  const text = React.useMemo(() => {
    if (typeof value === 'string') {
      const date = localisationService.generateDate({
        daysOffset: undefined,
        value,
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
    <div className="cypress-date-element">
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
              type="date"
              name={element.name}
              value={typeof value === 'string' ? value : ''}
              placeholder={element.placeholderValue}
              disabled={element.readOnly}
              className="input ob-input cypress-date-control"
              onBlur={setIsDirty}
              autoComplete={autocompleteAttributes}
              aria-describedby={ariaDescribedby}
              min={minDate}
              max={maxDate}
              onChange={(e) => {
                handleChange(e.target.value)
              }}
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
