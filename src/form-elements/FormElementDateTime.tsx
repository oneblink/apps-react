import * as React from 'react'
import { localisationService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import { DateTimePicker } from '@mui/x-date-pickers'

import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'

import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { parseDateValue } from '../services/generate-default-data'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import useFormElementDateFromTo from '../hooks/useFormElementDateFromTo'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import useFormDatePickerProps, {
  PickerInputButton,
} from '../hooks/form-date-picker/useFormDatePickerProps'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

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
  const ariaDescribedby = useElementAriaDescribedby(id, element)

  const { fromDate, fromDaysOffset, toDate, toDaysOffset } =
    useFormElementDateFromTo(element)

  const shortDateTimeFormat =
    localisationService.getDateFnsFormats().shortDateTime

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

  const [commonProps, openDateTimePicker] = useFormDatePickerProps({
    id,
    value: typeof value === 'string' ? value : undefined,
    maxDate,
    minDate,
    ariaDescribedby,
    placeholder: element.placeholderValue,
    className: 'cypress-date-time-control',
    disabled: element.readOnly,
    required: element.required,
    onBlur: setIsDirty,
    onChange: (newDate) => {
      onChange(element, {
        value: newDate?.toISOString(),
      })
    },
  })

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
          <DateTimePicker
            label={element.label}
            format={shortDateTimeFormat}
            {...commonProps}
            timeSteps={{ minutes: 1 }}
          />
          {!element.readOnly && (
            <PickerInputButton
              tooltip="Select date and time"
              onClick={openDateTimePicker}
              icon="date_range"
            />
          )}
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
          <FormElementValidationMessage>
            {validationMessage}
          </FormElementValidationMessage>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementDateTime)
