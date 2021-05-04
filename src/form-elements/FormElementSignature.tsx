import * as React from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { FormTypes } from '@oneblink/types'

import scrollingService from '../services/scrolling-service'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import OnLoading from '../components/OnLoading'

type Props = {
  id: string
  element: FormTypes.DrawElement
  value: unknown
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementSignature({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const handleChange = React.useCallback(
    (newValue: string) => {
      onChange(element, newValue)
    },
    [element, onChange],
  )
  const handleClear = React.useCallback(() => {
    onChange(element, undefined)
  }, [element, onChange])

  return (
    <div className="cypress-signature-element">
      <FormElementLabelContainer
        className="ob-signature"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="control">
          {typeof value === 'string' ? (
            <SignatureDisplay
              element={element}
              value={value}
              onClear={handleClear}
            />
          ) : (
            <SignatureDrawing element={element} onChange={handleChange} />
          )}
        </div>

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

export default React.memo(FormElementSignature)

function SignatureDrawing({
  element,
  onChange,
}: {
  element: FormTypes.DrawElement
  onChange: (newValue: string) => void
}) {
  const canvasRef = React.useRef<SignatureCanvas>(null)

  const [isEmpty, setIsEmpty] = React.useState(true)
  const [canvasDimensions, setCanvasDimensions] = React.useState({})

  const handleClear = React.useCallback(() => {
    if (canvasRef.current) {
      console.log('Clearing signature...')
      canvasRef.current.clear()
    }
    setIsEmpty(true)
  }, [])

  const handleDone = React.useCallback(() => {
    if (!canvasRef.current) return
    onChange(canvasRef.current.getTrimmedCanvas().toDataURL())
  }, [onChange])

  // HANDLING CANVAS CHANGE
  const handleEndDraw = React.useCallback(() => {
    if (window.cordova) {
      scrollingService.enableScrolling()
    }
    if (isEmpty) {
      setIsEmpty(false)
    }
  }, [isEmpty])

  // HANDLE RESIZE
  React.useEffect(() => {
    const signatureCanvas = canvasRef.current
    if (!signatureCanvas) return
    const resize = () => {
      const parentDiv = signatureCanvas.getCanvas().parentNode
      if (parentDiv) {
        setCanvasDimensions({
          // @ts-expect-error ???
          width: parentDiv.clientWidth,
          // @ts-expect-error ???
          height: parentDiv.clientHeight,
        })
      }
    }
    window.addEventListener('resize', resize)
    resize()

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [canvasRef])

  // REACTIVE DISABLING OF CANVAS
  React.useEffect(() => {
    if (!canvasRef.current) return
    if (element.readOnly) {
      canvasRef.current.off()
    } else {
      canvasRef.current.on()
    }
  }, [canvasRef, element.readOnly])

  return (
    <>
      <div>
        <SignatureCanvas
          ref={canvasRef}
          canvasProps={{
            ...canvasDimensions,
            className:
              'input ob-signature__control cypress-signature-control signature-pad',
            // @ts-expect-error ???
            disabled: element.readOnly,
          }}
          onEnd={handleEndDraw}
          onBegin={
            window.cordova ? scrollingService.disableScrolling : undefined
          }
        />
      </div>

      <div className="buttons ob-buttons">
        <button
          type="button"
          className="button ob-button is-light ob-button__clear cypress-clear-signature"
          onClick={handleClear}
          disabled={element.readOnly || isEmpty}
        >
          Clear
        </button>
        <button
          type="button"
          className="button ob-button ob-button__done is-primary cypress-done-signature-button"
          onClick={handleDone}
          disabled={element.readOnly || isEmpty}
        >
          Done
        </button>
      </div>
    </>
  )
}

function SignatureDisplay({
  element,
  value,
  onClear,
}: {
  element: FormTypes.DrawElement
  value: string
  onClear: () => void
}) {
  return (
    <>
      <figure className="ob-figure">
        <div className="figure-content">
          {value ? (
            <img
              src={value}
              className="cypress-signature-image ob-signature__img"
            />
          ) : (
            <OnLoading small className="cypress-signature-loading-image" />
          )}
        </div>
      </figure>

      <div className="buttons ob-buttons">
        <button
          type="button"
          className="button ob-button is-light ob-button__clear cypress-clear-signature"
          onClick={onClear}
          disabled={element.readOnly}
        >
          Clear
        </button>
      </div>
    </>
  )
}
