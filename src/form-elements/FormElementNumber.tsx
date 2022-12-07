import * as React from 'react'
import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import _debounce from 'lodash.debounce'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler } from '../types/form'
import useIsPageVisible from '../hooks/useIsPageVisible'

type Props = {
  id: string
  element: FormTypes.NumberElement
  value: unknown
  onChange: FormElementValueChangeHandler<number>
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementNumber({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const isPageVisible = useIsPageVisible()
  const htmlInputElementRef = React.useRef<HTMLInputElement>(null)

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

  const handleBlur = React.useCallback(
    (event) => {
      if (htmlInputElementRef.current) {
        const newValue = parseFloat(event.target.value)
        if (Number.isNaN(newValue)) {
          htmlInputElementRef.current.value = ''
        }
      }
      setIsDirty()
    },
    [setIsDirty],
  )

  return (
    <div className="cypress-number-element">
      <FormElementLabelContainer
        className="ob-number"
        id={id}
        element={element}
        required={element.required}
      >
        {!element.isSlider ? (
          <div className="field has-addons">
            <div className="control is-expanded has-icons-right">
              <input
                ref={htmlInputElementRef}
                type="number"
                placeholder={element.placeholderValue}
                id={id}
                value={text}
                name={element.name}
                className="input ob-input cypress-number-control"
                onChange={handleChange}
                required={element.required}
                disabled={element.readOnly}
                onBlur={handleBlur}
              />
              <span className="ob-input-icon icon is-small is-right">
                <i className="material-icons is-size-5">tag</i>
              </span>
            </div>
            {!!element.readOnly && !!text && (
              <div className="control">
                <CopyToClipboardButton
                  className="button is-input-addon copy-button cypress-copy-to-clipboard-button"
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
        ) : isPageVisible ? (
          <SliderControl
            id={id}
            text={text}
            value={value}
            element={element}
            onChange={handleChange}
            onBlur={setIsDirty}
          />
        ) : undefined}

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

const sliderBubbleWidthInPixels = 24

const SliderControl = React.memo(function SliderControl({
  id,
  text,
  value,
  element,
  onChange,
  onBlur,
}: {
  id: string
  text: string
  value: unknown
  element: FormTypes.NumberElement
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => unknown
  onBlur: () => void
}) {
  const sliderOutputRef = React.useRef<HTMLOutputElement>(null)
  const sliderInputRef = React.useRef<HTMLInputElement>(null)

  const number = React.useMemo(
    () => (typeof value === 'number' ? value : parseFloat(value as string)),
    [value],
  )

  const removeIsDraggingClass = React.useMemo(
    () =>
      _debounce((outputElement: HTMLOutputElement) => {
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

export default React.memo(FormElementNumber)
