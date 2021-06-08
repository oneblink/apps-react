import * as React from 'react'
import clsx from 'clsx'
import useBooleanState from '../hooks/useBooleanState'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import { Switch } from '@material-ui/core'

type Props = {
  id: string
  element: FormTypes.BooleanElement
  value: unknown
  onChange: FormElementValueChangeHandler<boolean>
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementBoolean({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [isDirty, setIsDirty] = useBooleanState(false)
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
            color="default"
            className={clsx('ob-boolean__input', 'cypress-boolean-control', {
              'ob-boolean__input-checked': !!value,
            })}
            checked={!!value}
            disabled={element.readOnly}
            onChange={(e) => {
              setIsDirty()
              onChange(element, e.target.checked)
            }}
            disableRipple
          />
        }
      >
        {(isDirty || displayValidationMessage) && !!validationMessage && (
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
