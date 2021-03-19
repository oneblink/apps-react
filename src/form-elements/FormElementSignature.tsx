import * as React from 'react'
import SignatureCanvas from 'react-signature-canvas'
import * as canvasManipulation from '@blinkmobile/canvas-manipulation'
import { FormTypes } from '@oneblink/types'

import useBooleanState from '../hooks/useBooleanState'
import scrollingService from '../services/scrolling-service'
import FormElementLabelContainer from '../components/FormElementLabelContainer'

type Props = {
  id: string
  element: FormTypes.DrawElement
  value: unknown
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: unknown | undefined,
  ) => unknown
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
  const [isDirty] = useBooleanState(false)
  const [isDisabled, setIsDisabled, setNotDisabled] = useBooleanState(false)
  const [canvasDimensions, setCanvasDimensions] = React.useState({})
  const canvasRef = React.useRef<SignatureCanvas>(null)

  // REACTIVE DISABLING OF CANVAS
  React.useEffect(() => {
    if (!canvasRef.current) return
    if (isDisabled || element.readOnly) {
      canvasRef.current.off()
    } else {
      canvasRef.current.on()
    }
  }, [isDisabled, canvasRef, element.readOnly])

  // SETTING CANVAS FROM PASSED VALUE
  React.useEffect(() => {
    const signatureCanvas = canvasRef.current
    if (!signatureCanvas || !value || typeof value !== 'string') return
    console.log('Setting signature starting value...')
    const image = new Image()
    image.onload = () => {
      canvasManipulation.drawImageCentered(signatureCanvas.getCanvas(), image)
      // @ts-expect-error ???
      signatureCanvas._sigPad._isEmpty = false
    }
    image.src = value

    // To ensure value only gets set once (prefill data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef])

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

  // HANDLING CANVAS CHANGE
  const handleBeginDraw = React.useCallback(() => {
    if (window.cordova) {
      scrollingService.disableScrolling()
    }
  }, [])

  const handleEndDraw = React.useCallback(() => {
    if (window.cordova) {
      scrollingService.enableScrolling()
    }
    if (!canvasRef.current) return
    const val = canvasRef.current.getTrimmedCanvas().toDataURL()
    onChange(element, val)
  }, [element, onChange, canvasRef])

  // HANDLING CLEAR
  const handleClear = React.useCallback(() => {
    if (!canvasRef.current) return
    console.log('Clearing signature...')
    canvasRef.current.clear()
    onChange(element, undefined)
    setNotDisabled()
  }, [element, onChange, canvasRef, setNotDisabled])

  return (
    <div className="cypress-signature-element">
      <FormElementLabelContainer
        className="ob-signature"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="control">
          <div>
            <SignatureCanvas
              ref={canvasRef}
              canvasProps={{
                ...canvasDimensions,
                className:
                  'input ob-signature__control cypress-signature-control signature-pad',
                // @ts-expect-error ???
                disabled: isDisabled || element.readOnly,
              }}
              onEnd={handleEndDraw}
              onBegin={handleBeginDraw}
            ></SignatureCanvas>
          </div>

          <div className="buttons ob-buttons">
            <button
              type="button"
              className="button ob-button is-light ob-button__clear cypress-clear-signature"
              onClick={handleClear}
              disabled={element.readOnly}
            >
              Clear
            </button>
            {!element.readOnly && (
              <button
                type="button"
                className="button ob-button ob-button__done is-primary cypress-done-signature-button"
                onClick={setIsDisabled}
                disabled={isDisabled}
              >
                Done
              </button>
            )}
          </div>
        </div>

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

export default React.memo(FormElementSignature)
