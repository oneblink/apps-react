import * as React from 'react'
import { localisationService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import { TimePicker } from '@mui/x-date-pickers'

import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'

import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import useFormDatePickerProps, {
  PickerInputButton,
} from '../hooks/form-date-picker/useFormDatePickerProps'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

type Props = {
  id: string
  element: FormTypes.TimeElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

const timeFormat = localisationService.getDateFnsFormats().time

function FormElementTime({
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

  const [commonProps, openTimePicker] = useFormDatePickerProps({
    id,
    value: typeof value === 'string' ? value : undefined,
    maxDate: undefined,
    minDate: undefined,
    ariaDescribedby,
    placeholder: element.placeholderValue,
    className: 'cypress-time-control',
    disabled: element.readOnly,
    required: element.required,
    onBlur: setIsDirty,
    onChange: (newDate) => {
      onChange(element, {
        value: newDate?.toISOString(),
      })
    },
  })

  const timeProps = React.useMemo(() => {
    // maxDate and minDate not applicable to a timepicker
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { maxDate, minDate, ...rest } = commonProps
    return rest
  }, [commonProps])

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
    <div className="cypress-time-element">
      <FormElementLabelContainer
        className="ob-time"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="field has-addons">
          <TimePicker
            label={element.label}
            format={timeFormat}
            {...timeProps}
            timeSteps={{ minutes: 1 }}
          />
          {!element.readOnly && (
            <PickerInputButton
              tooltip="Select time"
              onClick={openTimePicker}
              icon="schedule"
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
          <FormElementValidationMessage message={validationMessage} />
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementTime)
