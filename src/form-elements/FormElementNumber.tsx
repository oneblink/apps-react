import * as React from 'react'
import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import _debounce from 'lodash.debounce'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import { localisationService } from '@oneblink/apps'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import useIsPageVisible from '../hooks/useIsPageVisible'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import MaterialIcon from '../components/MaterialIcon'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

type Props = {
  id: string
  element: FormTypes.NumberElement
  value: unknown
  onChange: FormElementValueChangeHandler<number>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  autocompleteAttributes?: string
} & IsDirtyProps

function FormElementNumber({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
  autocompleteAttributes,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const isPageVisible = useIsPageVisible()

  const text = React.useMemo(() => {
    if (typeof value !== 'number') {
      return ''
    }
    if (element.displayAsCurrency) {
      return localisationService.formatCurrency(value)
    }
    return value.toString()
  }, [value, element.displayAsCurrency])
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(event.target.value)
      onChange(element, {
        value: isNaN(newValue) ? undefined : newValue,
      })
    },
    [element, onChange],
  )
  const htmlInputElementRef = React.useRef<HTMLInputElement>(null)

  //this onWheel callback prevents numbers changing while scrolling
  const handleWheel = React.useCallback(() => {
    if (htmlInputElementRef.current !== document.activeElement) {
      return
    }
    htmlInputElementRef.current?.blur()
    setTimeout(() => {
      htmlInputElementRef.current?.focus()
    })
  }, [])

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp

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
                type="number"
                placeholder={element.placeholderValue}
                id={id}
                value={typeof value === 'number' ? value : ''}
                name={element.name}
                className="input ob-input cypress-number-control"
                onChange={handleChange}
                required={element.required}
                disabled={element.readOnly}
                onBlur={setIsDirty}
                ref={htmlInputElementRef}
                onWheel={handleWheel}
                aria-describedby={ariaDescribedby}
                autoComplete={autocompleteAttributes}
                aria-required={element.required}
              />
              <span className="ob-input-icon icon is-small is-right">
                <MaterialIcon className="is-size-5">
                  {element.displayAsCurrency ? 'attach_money' : 'tag'}
                </MaterialIcon>
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
              lookupButtonConfig={element.lookupButton}
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
            ariaDescribedby={ariaDescribedby}
          />
        ) : undefined}

        {isDisplayingValidationMessage && (
          <FormElementValidationMessage message={validationMessage} />
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
  ariaDescribedby,
}: {
  id: string
  text: string
  value: unknown
  element: FormTypes.NumberElement
  ariaDescribedby: string | undefined
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
        value={number}
        type="range"
        onChange={onChange}
        required={element.required}
        aria-describedby={ariaDescribedby}
        aria-required={element.required}
        disabled={element.readOnly}
        onBlur={onBlur}
      />
    </div>
  )
})

export default React.memo(FormElementNumber)
