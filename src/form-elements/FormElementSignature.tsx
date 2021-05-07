import * as React from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { FormTypes } from '@oneblink/types'

import scrollingService from '../services/scrolling-service'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import OnLoading from '../components/OnLoading'
import useAttachment from '../hooks/attachments/useAttachment'
import { FormElementBinaryStorageValue } from '../types/attachments'
import { prepareNewAttachment } from '../services/attachments'
import AttachmentStatus from '../components/attachments/AttachmentStatus'
import useBooleanState from '../hooks/useBooleanState'
import { urlToBlobAsync } from '../services/blob-utils'
import ImagePreviewUnavailable from '../components/attachments/ImagePreviewUnavailable'

type Props = {
  id: string
  element: FormTypes.DrawElement
  value: FormElementBinaryStorageValue
  onChange: FormElementValueChangeHandler<FormElementBinaryStorageValue>
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
  const [isDirty, setIsDirty] = useBooleanState(false)

  const handleChange = React.useCallback(
    (formElement, newValue) => {
      setIsDirty()
      onChange(formElement, newValue)
    },
    [onChange, setIsDirty],
  )

  return (
    <div className="cypress-signature-element">
      <FormElementLabelContainer
        className="ob-signature"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="control">
          {value ? (
            <SignatureDisplay
              element={element}
              value={value}
              onChange={handleChange}
            />
          ) : (
            <SignatureDrawing element={element} onChange={handleChange} />
          )}
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

const SignatureDrawing = React.memo(function SignatureDrawing({
  element,
  onChange,
}: {
  element: Props['element']
  onChange: Props['onChange']
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

  const handleDone = React.useCallback(async () => {
    if (!canvasRef.current) return
    const value = canvasRef.current.getTrimmedCanvas().toDataURL()

    if (!element.storageType || element.storageType === 'legacy') {
      onChange(element, value)
      return
    }

    // Convert base64 data uri to blob and send it on its way
    const blob = await urlToBlobAsync(value)
    onChange(element, prepareNewAttachment(blob, 'signature.png', element))
  }, [element, onChange])

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
})

const SignatureDisplay = React.memo(function SignatureDisplay({
  element,
  value,
  onChange,
}: {
  element: Props['element']
  value: Props['value']
  onChange: Props['onChange']
}) {
  const result = useAttachment(
    value,
    element,
    React.useCallback(
      (id, attachment) => {
        onChange(element, attachment)
      },
      [element, onChange],
    ),
  )

  return (
    <>
      <figure className="ob-figure">
        <div className="figure-content">
          <DisplayImage {...result} />
        </div>
      </figure>

      <div className="buttons ob-buttons">
        <button
          type="button"
          className="button ob-button is-light ob-button__clear cypress-clear-signature"
          onClick={() => onChange(element, undefined)}
          disabled={element.readOnly}
        >
          Clear
        </button>
      </div>
    </>
  )
})

const DisplayImage = React.memo(function DisplayImage({
  uploadErrorMessage,
  isUploading,
  isLoadingImageUrl,
  imageUrl,
  loadImageUrlError,
  canDownload,
}: ReturnType<typeof useAttachment>) {
  if (uploadErrorMessage) {
    return (
      <>
        <h3 className="title is-3">Upload Failed</h3>
        <p>
          Your signature failed to upload, please press the <b>Clear</b> button
          and try again.
        </p>
      </>
    )
  }

  if (loadImageUrlError) {
    return (
      <>
        <h3 className="title is-3">Preview Failed</h3>
        <p>{loadImageUrlError.message}</p>
      </>
    )
  }

  if (isLoadingImageUrl) {
    return <OnLoading small className="cypress-signature-loading-image" />
  }

  if (imageUrl) {
    return (
      <>
        <span className="ob-figure__status">
          <AttachmentStatus
            canDownload={canDownload}
            isLoadingImageUrl={isLoadingImageUrl}
            loadImageUrlError={loadImageUrlError}
            isUploading={isUploading}
            uploadErrorMessage={uploadErrorMessage}
            imageUrl={imageUrl}
          />
        </span>
        <img
          src={imageUrl}
          className="cypress-signature-image ob-signature__img"
        />
      </>
    )
  }

  return <ImagePreviewUnavailable />
})
