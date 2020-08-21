// @flow
'use strict'

import * as React from 'react'
import clsx from 'clsx'

import FormElementOptions from '../components/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import LookupButton from '../components/LookupButton'

/* ::
type Props = {
  id: string,
  element: CheckboxElement,
  value: mixed,
  onChange: (FormElement, mixed | void) => void,
  displayValidationMessage: boolean,
  validationMessage: string | void,
  onConditionallyShowOption: (ChoiceElementOption) => boolean,
}
*/

function FormElementCheckboxes(
  {
    id,
    element,
    value,
    onChange,
    validationMessage,
    displayValidationMessage,
    onConditionallyShowOption,
  } /* : Props */,
) {
  const changeValues = React.useCallback(
    (newValue) => {
      let hasSelectedValue = Array.isArray(value)
        ? value.includes(newValue)
        : false
      let updatedValues = null
      if (hasSelectedValue) {
        updatedValues = Array.isArray(value) ? [...value] : []
        updatedValues = updatedValues.filter(
          (existingValue) => existingValue !== newValue,
        )
      } else {
        updatedValues = Array.isArray(value) ? [...value] : []
        updatedValues.push(newValue)
      }
      if (!updatedValues.length) {
        updatedValues = null
      }
      onChange(element, updatedValues)
    },
    [element, value, onChange],
  )
  const filteredOptions = useFormElementOptions({
    element,
    value,
    onChange,
    onFilter: onConditionallyShowOption,
  })

  return (
    <div className="cypress-checkbox-element">
      <div className="ob-form__element ob-checkbox">
        <label
          className={clsx('label ob-label', {
            'is-required': element.required,
          })}
          htmlFor={id}
        >
          {element.label}
        </label>
        <FormElementOptions options={element.options}>
          {element.buttons ? (
            <div className="ob-button-radio-container">
              <div className="buttons ob-buttons ob-buttons-radio">
                {filteredOptions.map((option, index) => {
                  return (
                    <button
                      key={index}
                      type="button"
                      className={clsx(
                        'button ob-button ob-button__input ob-checkbox__button cypress-checkbox-button-control',
                        {
                          'is-primary':
                            Array.isArray(value) &&
                            value.includes(option.value),
                          'is-light':
                            !Array.isArray(value) ||
                            !value.includes(option.value),
                          'background-color':
                            Array.isArray(value) &&
                            value.includes(option.value),
                        },
                      )}
                      onClick={() => changeValues(option.value)}
                      disabled={element.readOnly}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div>
              {filteredOptions.map((option, index) => {
                return (
                  <div className="control" key={index}>
                    <label
                      className="checkbox ob-checkbox__input-label cypress-checkbox-label"
                      disabled={element.readOnly}
                      htmlFor={`${id}_${option.value}`}
                    >
                      <input
                        type="checkbox"
                        className="checkbox ob-checkbox__input cypress-checkbox-control"
                        value={option.value}
                        id={`${id}_${option.value}`}
                        checked={
                          Array.isArray(value) && value.includes(option.value)
                        }
                        onChange={() => changeValues(option.value)}
                        disabled={element.readOnly}
                      />{' '}
                      {option.label}
                    </label>
                  </div>
                )
              })}
            </div>
          )}

          <LookupButton
            hasMarginTop
            value={value}
            validationMessage={validationMessage}
          />
        </FormElementOptions>

        {displayValidationMessage && !!validationMessage && (
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
  FormElementCheckboxes,
) /*: React.AbstractComponent<Props> */)
