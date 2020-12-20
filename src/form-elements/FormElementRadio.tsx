import * as React from 'react'
import clsx from 'clsx'

import FormElementOptions from '../components/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import useBooleanState from '../hooks/useBooleanState'
import { FormTypes } from '@oneblink/types'
import useContrastColor from '../hooks/useContrastColor'
type Props = {
  id: string
  element: FormTypes.RadioButtonElement
  value: unknown
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: unknown | undefined,
  ) => unknown
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
      <div className="ob-form__element ob-radio">
        <label
          className={clsx('label ob-label', {
            'is-required': element.required,
          })}
        >
          {element.label}
        </label>

        <FormElementOptions options={element.options}>
          {!element.buttons ? (
            <div>
              {filteredOptions.map((option) => (
                <div className="control" key={option.value}>
                  <label
                    className="checkbox ob-radio__input-label cypress-radio-label"
                    htmlFor={`${id}_${option.value}`}
                    // @ts-expect-error ???
                    disabled={element.readOnly}
                  >
                    <input
                      type="radio"
                      className="checkbox ob-radio__input cypress-radio-control"
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
              {filteredOptions.map((option) => (
                <RadioOptionButton
                  key={option.value}
                  element={element}
                  option={option}
                  isSelected={value === option.value}
                  onClick={() => {
                    setIsDirty()
                    onChange(element, option.value)
                  }}
                />
              ))}
            </div>
          )}
        </FormElementOptions>

        {(isDirty || displayValidationMessage) && !!validationMessage && (
          <div role="alert">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type RadioOptionButtonProps = {
  element: Props['element']
  option: FormTypes.ChoiceElementOption
  isSelected: boolean
  onClick: () => void
}
const RadioOptionButton = React.memo(function RadioOptionButton({
  element,
  option,
  isSelected,
  onClick,
}: RadioOptionButtonProps) {
  const buttonContrastColor = useContrastColor(option.colour)
  return (
    <div className="ob-button-radio-container">
      <button
        type="button"
        className={clsx(
          'button ob-button ob-button__input ob-radio__button cypress-radio-button-control',
          {
            'is-primary': isSelected,
            'is-light': !isSelected,
          },
        )}
        style={
          option.colour && isSelected
            ? { backgroundColor: option.colour, color: buttonContrastColor }
            : undefined
        }
        disabled={element.readOnly}
        onClick={onClick}
      >
        {` ${option.label}`}
      </button>
    </div>
  )
})
export default React.memo(FormElementRadio)
