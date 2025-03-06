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
import useFormDatePickerProps from '../hooks/form-date-picker/useFormDatePickerProps'

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

  const commonProps = useFormDatePickerProps({
    id,
    value: typeof value === 'string' ? value : undefined,
    maxDate: undefined,
    minDate: undefined,
    icon: 'schedule',
    ariaDescribedby,
    placeholder: element.placeholderValue,
    className: 'cypress-time-control',
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
          <div className="control is-expanded has-icons-right">
            <TimePicker
              label={element.label}
              format={timeFormat}
              {...timeProps}
              disabled={element.readOnly}
              timeSteps={{ minutes: 1 }}
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

export default React.memo(FormElementTime)
