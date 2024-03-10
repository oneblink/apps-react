import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { Switch } from '@mui/material'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'

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
            aria-describedby={`${id}-hint`}
          />
        }
      >
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

export default React.memo(FormElementBoolean)
