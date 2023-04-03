import * as React from 'react'
import clsx from 'clsx'
import { Checkbox } from '@mui/material'

import FormElementOptions from '../components/renderer/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import OptionButton from './OptionButton'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import ToggleAllCheckbox from '../components/renderer/ToggleAllCheckbox'
import {
  FormElementValueChangeHandler,
  FormElementConditionallyShownElement,
} from '../types/form'

type Props = {
  id: string
  element: FormTypes.CheckboxElement
  value: unknown
  onChange: FormElementValueChangeHandler<string[]>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  conditionallyShownOptionsElement:
    | FormElementConditionallyShownElement
    | undefined
}

function FormElementCheckboxes({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  conditionallyShownOptionsElement,
}: Props) {
  const selectedValues = React.useMemo(() => {
    if (!Array.isArray(value)) return []
    return value
  }, [value])

  const changeValues = React.useCallback(
    (toggledValue: string, hasSelectedValue: boolean) => {
      onChange(element, (existingValue) => {
        if (hasSelectedValue) {
          const newValue = (existingValue || []).filter(
            (existingValue) => existingValue !== toggledValue,
          )
          if (newValue.length) {
            return newValue
          }
        } else {
          const newValue = Array.isArray(existingValue)
            ? [...existingValue]
            : []
          newValue.push(toggledValue)
          return newValue
        }
      })
    },
    [element, onChange],
  )

  const filteredOptions = useFormElementOptions({
    element,
    value,
    onChange,
    conditionallyShownOptionsElement,
  })

  return (
    <div className="cypress-checkbox-element">
      <FormElementLabelContainer
        className="ob-checkbox"
        id={id}
        element={element}
        required={element.required || !!element.requiredAll}
      >
        <FormElementOptions
          options={element.options}
          conditionallyShownOptionsElement={conditionallyShownOptionsElement}
        >
          {element.canToggleAll && (
            <ToggleAllCheckbox
              id={id}
              element={element}
              options={filteredOptions}
              selected={selectedValues}
              disabled={element.readOnly}
              onChange={onChange}
            />
          )}
          {element.buttons ? (
            <div className="ob-button-radio-container">
              <div className="buttons ob-buttons ob-buttons-radio">
                {filteredOptions.map((option, index) => {
                  const isSelected = selectedValues.includes(option.value)
                  return (
                    <OptionButton
                      key={index}
                      element={element}
                      option={option}
                      isSelected={isSelected}
                      onClick={() => changeValues(option.value, isSelected)}
                      className={clsx(
                        'button ob-button ob-button__input ob-checkbox__button cypress-checkbox-button-control',
                        {
                          'is-primary': isSelected,
                          'is-light': !isSelected,
                        },
                      )}
                    />
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="ob-checkbox-container">
              {filteredOptions.map((option, index) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <div className="control" key={index}>
                    <label
                      className="checkbox ob-checkbox__input-label cypress-checkbox-label"
                      htmlFor={`${id}_${option.value}`}
                    >
                      <Checkbox
                        color="primary"
                        className="ob-checkbox__input cypress-checkbox-control"
                        classes={{
                          checked: 'ob-checkbox__input-checked',
                        }}
                        disableRipple
                        value={option.value}
                        id={`${id}_${option.value}`}
                        checked={isSelected}
                        onChange={() => changeValues(option.value, isSelected)}
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

export default React.memo(FormElementCheckboxes)
