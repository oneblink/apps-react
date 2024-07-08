import * as React from 'react'
import SignatureCanvas from 'react-signature-canvas'
import useResizeObserver, { ObservedSize } from 'use-resize-observer'
import { FormTypes } from '@oneblink/types'

import scrollingService from '../services/scrolling-service'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import OnLoading from '../components/renderer/OnLoading'
import useAttachment from '../hooks/attachments/useAttachment'
import { FormElementBinaryStorageValue } from '../types/attachments'
import { prepareNewAttachment } from '../services/attachments'
import AttachmentStatus from '../components/renderer/attachments/AttachmentStatus'
import { canvasToBlob } from '../services/blob-utils'
import ImagePreviewUnavailable from '../components/renderer/attachments/ImagePreviewUnavailable'
import { FormElementValueChangeHandler } from '../types/form'
import useIsPageVisible from '../hooks/usePage'
import ProgressBar from '../components/renderer/attachments/ProgressBar'
import { IsDirtyProps } from '../types/form'

type Props = {
  id: string
  element: FormTypes.DrawElement
  value: FormElementBinaryStorageValue
  onChange: FormElementValueChangeHandler<FormElementBinaryStorageValue>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

function FormElementSignature({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  setIsDirty,
  isDirty,
}: Props) {
  const isPageVisible = useIsPageVisible()

  const handleChange = React.useCallback<
    FormElementValueChangeHandler<FormElementBinaryStorageValue>
  >(
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
          ) : isPageVisible ? (
            <SignatureDrawing element={element} onChange={handleChange} />
          ) : null}
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
  const [canvasDimensions, setCanvasDimensions] = React.useState<ObservedSize>({
    width: undefined,
    height: undefined,
  })

  const handleClear = React.useCallback(() => {
    if (canvasRef.current) {
      console.log('Clearing signature...')
      canvasRef.current.clear()
    }
    setIsEmpty(true)
  }, [])

  const handleDone = React.useCallback(async () => {
    if (!canvasRef.current) return
    const trimmedCanvas = canvasRef.current.getTrimmedCanvas()

    // Convert base64 data uri to blob and send it on its way
    const blob = await canvasToBlob(trimmedCanvas)
    onChange(element, {
      value: prepareNewAttachment(blob, 'signature.png', element),
    })
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

  const { ref } = useResizeObserver<HTMLDivElement>({
    onResize: setCanvasDimensions,
  })

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
      <div ref={ref}>
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
          Save Signature
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
        onChange(element, {
          value: attachment,
        })
      },
      [element, onChange],
    ),
  )

  const handleRetry = React.useMemo(() => {
    if (!value || typeof value !== 'object') return

    if (value.type === 'ERROR' && value.data) {
      return () => {
        onChange(element, {
          value: {
            type: 'NEW',
            _id: value._id,
            data: value.data,
            fileName: value.fileName,
            isPrivate: value.isPrivate,
          },
        })
      }
    }
  }, [element, onChange, value])

  return (
    <>
      <figure className="ob-figure">
        <div className="figure-content">
          <DisplayImage {...result} alt={`${element.label}: Signature`} />
        </div>
      </figure>

      <div className="buttons ob-buttons">
        {result.uploadErrorMessage && handleRetry && (
          <button
            type="button"
            className="button ob-button ob-button__retry is-light cypress-retry-file-button"
            onClick={handleRetry}
          >
            Retry
          </button>
        )}
        <button
          type="button"
          className="button ob-button is-light ob-button__clear cypress-clear-signature"
          onClick={() =>
            onChange(element, {
              value: undefined,
            })
          }
          disabled={element.readOnly}
        >
          Clear
        </button>
      </div>
    </>
  )
})

const DisplayImage = React.memo(function DisplayImage({
  alt,
  uploadErrorMessage,
  isUploading,
  isLoadingImageUrl,
  imageUrl,
  loadImageUrlError,
  progress,
}: ReturnType<typeof useAttachment> & {
  alt: string
}) {
  if (uploadErrorMessage) {
    return (
      <>
        <h3 className="title is-3">Upload Failed</h3>
        <p>
          Your signature failed to upload, please use the <b>Retry</b> or{' '}
          <b>Clear</b> buttons below.
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
            isLoadingImageUrl={isLoadingImageUrl}
            loadImageUrlError={loadImageUrlError}
            isUploading={isUploading}
            imageUrl={imageUrl}
            progress={progress}
          />
        </span>
        <img
          src={imageUrl}
          className="cypress-signature-image ob-signature__img"
          alt={alt}
        />
        <ProgressBar progress={progress} isShowing={isUploading} />
      </>
    )
  }

  return <ImagePreviewUnavailable />
})
