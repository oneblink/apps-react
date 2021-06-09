import * as React from 'react'
import clsx from 'clsx'
import { Radio } from '@material-ui/core'

import FormElementOptions from '../components/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import useBooleanState from '../hooks/useBooleanState'
import { FormTypes } from '@oneblink/types'
import OptionButton from './OptionButton'
import FormElementLabelContainer from '../components/FormElementLabelContainer'

type Props = {
  id: string
  element: FormTypes.RadioButtonElement
  value: unknown
  onChange: FormElementValueChangeHandler<string>
  onConditionallyShowOption: (
    choiceElementOption: FormTypes.ChoiceElementOption,
  ) => boolean
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementRadio({
  id,
  element,
  value,
  onChange,
  onConditionallyShowOption,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [isDirty, setIsDirty] = useBooleanState(false)
  const filteredOptions = useFormElementOptions({
    element,
    value,
    onChange,
    onFilter: onConditionallyShowOption,
  })

  return (
    <div className="cypress-radio-element">
      <FormElementLabelContainer
        className="ob-radio"
        id={id}
        element={element}
        required={element.required}
      >
        <FormElementOptions options={element.options}>
          {!element.buttons ? (
            <div>
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
                      disableRipple
                      value={option.value || ''}
                      id={`${id}_${option.value}`}
                      disabled={element.readOnly}
                      checked={value === option.value}
                      onChange={(e) => {
                        setIsDirty()
                        onChange(element, e.target.value)
                      }}
                    />
                    {` ${option.label}`}
                  </label>
                </div>
              ))}
            </div>
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
                        onChange(element, option.value)
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
export default React.memo(FormElementRadio)
