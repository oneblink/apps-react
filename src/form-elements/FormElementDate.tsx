import * as React from 'react'
import { localisationService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import { DatePicker } from '@mui/x-date-pickers'
import { format } from 'date-fns'

import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'

import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { parseDateValue } from '../services/generate-default-data'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import useFormElementDateFromTo from '../hooks/useFormElementDateFromTo'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import useFormDatePickerProps from '../hooks/form-date-picker/useFormDatePickerProps'

const shortDateFormat = localisationService.getDateFnsFormats().shortDate

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

  const maxDate = React.useMemo(() => {
    return parseDateValue({
      dateOnly: true,
      daysOffset: toDaysOffset,
      value: toDate,
    })
  }, [toDate, toDaysOffset])

  const minDate = React.useMemo(() => {
    return parseDateValue({
      dateOnly: true,
      daysOffset: fromDaysOffset,
      value: fromDate,
    })
  }, [fromDate, fromDaysOffset])

  const commonProps = useFormDatePickerProps({
    id,
    value: typeof value === 'string' ? value : undefined,
    maxDate,
    minDate,
    icon: 'event',
    ariaDescribedby,
    autocompleteAttributes,
    placeholder: element.placeholderValue,
    className: 'cypress-date-control',
  })

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
            <DatePicker
              label={element.label}
              format={shortDateFormat}
              {...commonProps}
              onAccept={(newDate) => {
                onChange(element, {
                  value: newDate ? format(newDate, 'yyyy-MM-dd') : undefined,
                })
                setIsDirty()
              }}
              disabled={element.readOnly}
              onClose={setIsDirty}
            />
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
