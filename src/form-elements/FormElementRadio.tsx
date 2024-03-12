import * as React from 'react'
import clsx from 'clsx'
import { Radio, RadioGroup } from '@mui/material'

import FormElementOptions from '../components/renderer/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import { FormTypes } from '@oneblink/types'
import OptionButton from './OptionButton'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import {
  FormElementValueChangeHandler,
  FormElementConditionallyShownElement,
  IsDirtyProps,
  UpdateFormElementsHandler,
} from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'

type Props = {
  id: string
  element: FormTypes.RadioButtonElement
  value: unknown
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  conditionallyShownOptionsElement:
    | FormElementConditionallyShownElement
    | undefined
  onUpdateFormElements: UpdateFormElementsHandler
} & IsDirtyProps

function FormElementRadio({
  id,
  element,
  value,
  onChange,
  conditionallyShownOptionsElement,
  validationMessage,
  displayValidationMessage,
  onUpdateFormElements,
  isDirty,
  setIsDirty,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const filteredOptions = useFormElementOptions({
    element,
    value,
    onChange,
    conditionallyShownOptionsElement,
    onUpdateFormElements,
  })

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp

  return (
    <div className="cypress-radio-element">
      <FormElementLabelContainer
        className="ob-radio"
        id={id}
        element={element}
        required={element.required}
      >
        <FormElementOptions
          options={element.options}
          conditionallyShownOptionsElement={conditionallyShownOptionsElement}
        >
          {!element.buttons ? (
            <RadioGroup className="ob-radio-container">
              {filteredOptions.map((option) => (
                <div className="control" key={option.value}>
                  <label
                    className="radio ob-radio__input-label cypress-radio-label"
                    htmlFor={`${id}_${option.value}`}
                  >
                    <Radio
                      color="primary"
                      className="ob-radio__input cypress-radio-control"
                      classes={{
                        checked: 'ob-radio__input-checked',
                      }}
                      value={option.value || ''}
                      id={`${id}_${option.value}`}
                      disabled={element.readOnly}
                      checked={value === option.value}
                      onChange={(e) => {
                        setIsDirty()
                        onChange(element, {
                          value: e.target.value,
                        })
                      }}
                      edge="start"
                      inputProps={{
                        'aria-describedby': ariaDescribedby,
                      }}
                    />
                    {` ${option.label}`}
                  </label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="buttons ob-buttons ob-buttons-radio cypress-radio-button-group">
              {filteredOptions.map((option) => {
                const isSelected = value === option.value
                return (
                  <div className="ob-button-radio-container" key={option.value}>
                    <OptionButton
                      element={element}
                      option={option}
                      isSelected={isSelected}
                      onClick={() => {
                        setIsDirty()
                        onChange(element, {
                          value: option.value,
                        })
                      }}
                      className={clsx(
                        'button ob-button ob-button__input ob-radio__button cypress-radio-button-control',
                        {
                          'is-primary': isSelected,
                          'is-light': !isSelected,
                        },
                      )}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </FormElementOptions>

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
export default React.memo(FormElementRadio)
