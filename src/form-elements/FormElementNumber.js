// @flow
'use strict'

import * as React from 'react'
import clsx from 'clsx'
import CopyToClipboardButton from '../components/CopyToClipboardButton'
import _debounce from 'lodash.debounce'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/LookupButton'

/* ::
type Props = {
  id: string,
  element: NumberElement,
  value: mixed,
  onChange: (FormElement, value: number | void) => mixed,
  displayValidationMessage: boolean,
  validationMessage: string | void,
}
*/

function FormElementNumber(
  {
    id,
    element,
    value,
    onChange,
    validationMessage,
    displayValidationMessage,
  } /* : Props */,
) {
  const [isDirty, setIsDirty] = useBooleanState(false)
  const text = React.useMemo(
    () => (typeof value === 'number' ? value.toString() : ''),
    [value],
  )

  const handleChange = React.useCallback(
    (event) => {
      onChange(
        element,
        // e.target.value is a string so '0' becomes true
        event.target.value ? parseFloat(event.target.value) : undefined,
      )
    },
    [element, onChange],
  )

  return (
    <div className="cypress-number-element">
      <div className="ob-form__element ob-number">
        <label
          htmlFor={id}
          className={clsx('label ob-label', {
            'is-required': element.required,
          })}
        >
          {element.label}
        </label>
        {!element.isSlider ? (
          <div className="field has-addons">
            <div className="control is-expanded">
              <input
                type="number"
                placeholder={element.placeholderValue}
                id={id}
                name={element.name}
                className="input ob-input cypress-number-control"
                value={text}
                onChange={handleChange}
                required={element.required}
                disabled={element.readOnly}
                onBlur={setIsDirty}
              />
            </div>
            {!!element.readOnly && !!text && (
              <div className="control">
                <CopyToClipboardButton
                  className="button is-input-addon cypress-copy-to-clipboard-button"
                  isInputButton
                  text={text}
                />
              </div>
            )}
            <LookupButton
              isInputButton
              value={value}
              validationMessage={validationMessage}
            />
          </div>
        ) : (
          <SliderControl
            id={id}
            text={text}
            value={value}
            element={element}
            onChange={handleChange}
            onBlur={setIsDirty}
          />
        )}

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

/* ::
type SliderControlProps = {
  id: string,
  text: string,
  value: mixed,
  element: NumberElement,
  onChange: (SyntheticInputEvent<HTMLInputElement>) => mixed,
  onBlur: () => void,
}
*/

const sliderBubbleWidthInPixels = 24

const SliderControl = React.memo(function SliderControl(
  { id, text, value, element, onChange, onBlur } /* : SliderControlProps */,
) {
  const sliderOutputRef = React.useRef(null)
  const sliderInputRef = React.useRef(null)

  const number = React.useMemo(
    () => (typeof value === 'number' ? value : parseFloat(value)),
    [value],
  )

  const removeIsDraggingClass = React.useMemo(
    () =>
      _debounce((outputElement) => {
        if (outputElement.classList.contains('is-dragging')) {
          outputElement.classList.remove('is-dragging')
        }
      }, 500),
    [],
  )

  React.useEffect(() => {
    if (
      Number.isNaN(number) ||
      typeof element.maxNumber !== 'number' ||
      typeof element.minNumber !== 'number'
    ) {
      return
    }

    const outputElement = sliderOutputRef.current
    const inputElement = sliderInputRef.current
    if (outputElement && inputElement) {
      const range = element.maxNumber - element.minNumber
      const percentage = (number - element.minNumber) / range
      const inputWidth = inputElement.getBoundingClientRect().width
      const outputWidth = outputElement.getBoundingClientRect().width
      const sliderBubbleOffSetPixels =
        (percentage - 0.5) * -sliderBubbleWidthInPixels

      outputElement.style.left = `${percentage * inputWidth}px`
      outputElement.style.marginLeft = `-${
        outputWidth / 2 - sliderBubbleOffSetPixels
      }px`

      if (!outputElement.classList.contains('is-dragging')) {
        outputElement.classList.add('is-dragging')
      }
      removeIsDraggingClass(outputElement)
    }
  }, [element.maxNumber, element.minNumber, number, removeIsDraggingClass])

  return (
    <div className="control">
      <output
        ref={sliderOutputRef}
        className="ob-number__output cypress-number-output"
        htmlFor={id}
      >
        {text}
      </output>
      <input
        ref={sliderInputRef}
        id={id}
        name={element.name}
        className="slider ob-input is-fullwidth cypress-slider-number-control is-large is-circle cypress-number-control"
        step={element.sliderIncrement ? element.sliderIncrement : 1}
        min={element.minNumber}
        max={element.maxNumber}
        value={text}
        type="range"
        onChange={onChange}
        required={element.required}
        disabled={element.readOnly}
        onBlur={onBlur}
      />
    </div>
  )
})

export default (React.memo(
  FormElementNumber,
) /*: React.AbstractComponent<Props> */)
