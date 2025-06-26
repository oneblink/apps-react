import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { Checkbox, Switch } from '@mui/material'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

type Props = {
  id: string
  element: FormTypes.BooleanElement
  value: unknown
  onChange: FormElementValueChangeHandler<boolean>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

function FormElementBoolean({
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
  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp

  return (
    <div className="cypress-boolean-element">
      <FormElementLabelContainer
        className="ob-boolean"
        id={id}
        element={element}
        required={element.required}
        leading={
          element.displayAsCheckbox ? (
            <Checkbox
              color="primary"
              classes={{
                checked: 'ob-boolean-checkbox__input-checked',
              }}
              className="ob-boolean-checkbox__input cypress-checkbox-control"
              id={id}
              checked={!!value}
              onChange={(e) => {
                setIsDirty()
                onChange(element, {
                  value: e.target.checked,
                })
              }}
              disabled={element.readOnly}
              edge="start"
              inputProps={{
                'aria-describedby': ariaDescribedby,
                'aria-required': element.required,
              }}
              onBlur={setIsDirty}
            />
          ) : (
            <Switch
              id={id}
              name={element.name}
              color="primary"
              edge="start"
              className="ob-boolean__input cypress-boolean-control"
              classes={{
                checked: 'ob-boolean__input-checked',
              }}
              checked={!!value}
              disabled={element.readOnly}
              onChange={(e) => {
                setIsDirty()
                onChange(element, {
                  value: e.target.checked,
                })
              }}
              aria-describedby={ariaDescribedby}
              onBlur={setIsDirty}
            />
          )
        }
      >
        {isDisplayingValidationMessage && (
          <FormElementValidationMessage>
            {validationMessage}
          </FormElementValidationMessage>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementBoolean)
