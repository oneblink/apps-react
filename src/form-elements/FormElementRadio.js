// @flow
'use strict'

import * as React from 'react'
import clsx from 'clsx'

import FormElementOptions from '../components/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import useBooleanState from '../hooks/useBooleanState'

/* ::
type Props = {
  id: string,
  element: RadioButtonElement,
  value: mixed,
  onChange: (FormElement, mixed | void) => void,
  onConditionallyShowOption: (ChoiceElementOption) => boolean,
  displayValidationMessage: boolean,
  validationMessage: string | void,
}
*/

function FormElementRadio(
  {
    id,
    element,
    value,
    onChange,
    onConditionallyShowOption,
    validationMessage,
    displayValidationMessage,
  } /* : Props */,
) {
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
                <div className="ob-button-radio-container" key={option.value}>
                  <button
                    type="button"
                    className={clsx(
                      'button ob-button ob-button__input ob-radio__button cypress-radio-button-control',
                      {
                        'is-primary': value === option.value,
                        'is-light': value !== option.value,
                      },
                    )}
                    style={
                      option.colour && option.value === value
                        ? { backgroundColor: option.colour }
                        : undefined
                    }
                    disabled={element.readOnly}
                    onClick={() => {
                      setIsDirty()
                      onChange(element, option.value)
                    }}
                  >
                    {` ${option.label}`}
                  </button>
                </div>
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

export default (React.memo(
  FormElementRadio,
) /*: React.AbstractComponent<Props> */)
