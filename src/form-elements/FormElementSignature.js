// @flow
'use strict'

import * as React from 'react'
import clsx from 'clsx'
import SignatureCanvas from 'react-signature-canvas'
import * as canvasManipulation from '@blinkmobile/canvas-manipulation'

import useBooleanState from '../hooks/useBooleanState'
import scrollingService from '../services/scrolling-service'

/* ::
type Props = {
  element: DrawElement,
  value: mixed,
  onChange: (FormElement, Blob | void) => mixed,
  displayValidationMessage: boolean,
  validationMessage: string | void,
}
*/

function FormElementSignature(
  {
    element,
    value,
    onChange,
    validationMessage,
    displayValidationMessage,
  } /* : Props */,
) {
  const [isDirty] = useBooleanState(false)
  const [isDisabled, setIsDisabled, setNotDisabled] = useBooleanState(false)
  const [canvasDimensions, setCanvasDimensions] = React.useState({})
  const canvasRef = React.useRef()

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
    if (!canvasRef.current || !value || typeof value !== 'string') return
    console.log('Setting signature starting value...')
    const image = new Image()
    image.onload = () => {
      canvasManipulation.drawImageCentered(canvasRef.current.getCanvas(), image)
      canvasRef.current._sigPad._isEmpty = false
    }
    image.src = value

    // To ensure value only gets set once (prefill data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef])

  // HANDLE RESIZE
  React.useEffect(() => {
    if (!canvasRef.current) return
    const resize = () => {
      const parentDiv = canvasRef.current.getCanvas().parentNode
      setCanvasDimensions({
        width: parentDiv.clientWidth,
        height: parentDiv.clientHeight,
      })
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
      <div className="ob-form__element ob-signature">
        <label
          className={clsx('label ob-label', {
            'is-required': element.required,
          })}
        >
          {element.label}
        </label>
        <div className="control">
          <div>
            <SignatureCanvas
              // This library component expects a callback as an argument here, so ignoring flow error
              // $FlowFixMe
              ref={canvasRef}
              canvasProps={{
                ...canvasDimensions,
                className:
                  'input ob-signature__control cypress-signature-control signature-pad',
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
  FormElementSignature,
) /*: React.AbstractComponent<Props> */)
