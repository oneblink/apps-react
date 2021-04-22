import * as React from 'react'
import clsx from 'clsx'
import SignatureCanvas from 'react-signature-canvas'

import useBooleanState from '../hooks/useBooleanState'
import downloadFile from '../services/download-file'
import OnLoading from '../components/OnLoading'
import scrollingService from '../services/scrolling-service'
import { FormTypes } from '@oneblink/types'
import { localisationService } from '@oneblink/apps'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import parseFilesAsAttachments from '../services/parseFilesAsAttachments'

type Props = {
  id: string
  element: FormTypes.CameraElement
  value: unknown
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: unknown | undefined,
  ) => void
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

declare global {
  interface Navigator {
    camera: any
  }
}
declare global {
  interface Window {
    Camera: any
  }
}

function FormElementCamera({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [isLoading, setIsLoading, clearIsLoading] = useBooleanState(false)
  const [viewError, , , toggleError] = useBooleanState(false)
  const [cameraError, setCameraError] = React.useState<Error | null>(null)
  const [isDirty, setIsDirty] = useBooleanState(false)
  const [isAnnotating, setIsAnnotating, clearIsAnnotating] = useBooleanState(
    false,
  )
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const clearImage = React.useCallback(() => {
    if (fileInputRef.current) {
      // RESET HTML FILE INPUT VALUE SO FILES PREVIOUSLY ADDED AND REMOVED ARE RECOGNISED
      fileInputRef.current.value = ''
    }
    onChange(element, undefined)
  }, [element, onChange])
  const resetImage = React.useCallback(() => {
    onChange(element, undefined)
  }, [element, onChange])
  const fileChange = React.useCallback(
    async (changeEvent) => {
      if (
        !changeEvent.target ||
        !changeEvent.target.files ||
        !changeEvent.target.files.length
      ) {
        return
      }

      setIsLoading()
      resetImage()

      console.log('File selected event', changeEvent)
      try {
        const attachments = await parseFilesAsAttachments(
          changeEvent.target.files,
          (file: File, canvas: HTMLCanvasElement) => {
            if (!element.includeTimestampWatermark) {
              return
            }

            const context = canvas.getContext('2d')
            if (context) {
              const now = localisationService.formatDatetime(
                new Date(file.lastModified),
              )
              const textHeight = 20
              context.font = `${textHeight}px Arial`
              const { width: textWidth } = context.measureText(now)
              const backgroundMargin = 10
              const backgroundPadding = backgroundMargin
              const backgroundWidth = backgroundPadding * 2 + textWidth
              const backgroundHeight = backgroundPadding * 2 + textHeight
              context.fillStyle = 'rgba(20, 20, 20, 0.6)'
              context.fillRect(
                canvas.width - backgroundWidth - backgroundMargin,
                canvas.height - backgroundHeight - backgroundMargin,
                backgroundWidth,
                backgroundHeight,
              )

              context.fillStyle = '#FFF'
              context.fillText(
                now,
                canvas.width - textWidth - backgroundPadding - backgroundMargin,
                canvas.height - 22,
              )
            }
          },
        )

        if (attachments[0]) {
          setIsDirty()
          onChange(element, attachments[0].data)
        }
      } catch (error) {
        setCameraError(error)
        return
      } finally {
        clearIsLoading()
      }
    },
    [clearIsLoading, element, onChange, resetImage, setIsDirty, setIsLoading],
  )
  const openCamera = React.useCallback(() => {
    if (window.cordova && navigator.camera && navigator.camera.getPicture) {
      setIsLoading()
      navigator.camera.getPicture(
        (base64Data: string) => {
          onChange(element, `data:image/jpeg;base64,${base64Data}`)
          clearIsLoading()
        },
        (error: Error) => {
          console.warn(
            'An error occurred while attempting to take a photo',
            error,
          )
          setCameraError(error)
          clearIsLoading()
        },
        {
          quality: 100,
          destinationType: window.Camera.DestinationType.DATA_URL,
          sourceType: window.Camera.PictureSourceType.CAMERA,
          allowEdit: false,
          encodingType: window.Camera.EncodingType.JPEG,
          mediaType: window.Camera.MediaType.PICTURE,
          correctOrientation: true,
          saveToPhotoAlbum: false,
          cameraDirection: window.Camera.Direction.BACK,
        },
      )
    } else if (fileInputRef.current) {
      fileInputRef.current.click()
    } else {
      console.error(
        'Could not find "input" element in Camera component template',
      )
    }
  }, [setIsLoading, clearIsLoading, setCameraError, onChange, element])

  const handleDownload = React.useCallback(async () => {
    if (typeof value === 'string') {
      await downloadFile(value, id)
    }
  }, [value, id])

  const clearCameraError = React.useCallback(() => setCameraError(null), [
    setCameraError,
  ])

  const handleSaveAnnotation = React.useCallback(
    (annotation) => {
      clearIsAnnotating()
      setIsLoading()

      if (typeof value !== 'string') {
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }

      const image = new Image()
      image.onload = function () {
        canvas.width = image.width
        canvas.height = image.height

        ctx.drawImage(image, 0, 0)

        const annotationImage = new Image()
        annotationImage.onload = function () {
          ctx.drawImage(annotationImage, 0, 0, canvas.width, canvas.height)

          const base64Data = canvas.toDataURL()

          onChange(element, base64Data)
          clearIsLoading()
        }
        annotationImage.src = annotation
      }
      image.src = value
    },
    [clearIsAnnotating, clearIsLoading, element, onChange, setIsLoading, value],
  )

  return (
    <>
      <FormElementLabelContainer
        className="ob-camera"
        element={element}
        id={id}
        required={element.required}
      >
        <div className="control">
          {!isLoading && value !== undefined && (
            <figure className="ob-figure">
              <img
                src={value as string}
                className="cypress-camera-image ob-camera__img"
              ></img>
              <button
                type="button"
                className="button is-primary ob-camera__annotate-button cypress-annotate-button"
                onClick={setIsAnnotating}
                disabled={element.readOnly}
              >
                <span className="icon">
                  <i className="material-icons">brush</i>
                </span>
              </button>
            </figure>
          )}

          {isLoading && (
            <figure className="ob-figure">
              <div className="figure-content has-text-centered cypress-camera-loading-image">
                <OnLoading small={true}></OnLoading>
              </div>
            </figure>
          )}

          <input
            ref={fileInputRef}
            className="ob-input ob-camera__input-hidden cypress-camera-control"
            type="file"
            accept="image/*"
            capture="environment"
            id={id}
            name={element.name}
            required={element.required}
            disabled={element.readOnly}
            onChange={fileChange}
          />
          <div className="buttons ob-buttons">
            {value ? (
              <>
                <button
                  type="button"
                  className="button ob-button ob-button__clear is-light cypress-clear-camera"
                  onClick={clearImage}
                  disabled={element.readOnly || isLoading}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="button ob-button ob-button__download is-primary cypress-download-file-button"
                  onClick={handleDownload}
                >
                  <span className="icon">
                    <i className="material-icons">cloud_download</i>
                  </span>
                  <span>&nbsp;Download</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="button ob-button ob-button__open is-primary cypress-open-camera"
                onClick={openCamera}
                disabled={element.readOnly || isLoading}
              >
                Open Camera
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

      {isAnnotating && (
        <CameraAnnotation
          imageSrc={value}
          onClose={clearIsAnnotating}
          onSave={handleSaveAnnotation}
        />
      )}

      <div
        className={clsx('modal cypress-error-modal ob-modal', {
          'is-active': cameraError,
        })}
      >
        <div className="modal-background-faded"></div>
        <div className="modal-card">
          <header className="modal-card-head ob-modal__head">
            <p className="modal-card-title cypress-error-title">
              &apos;Whoops...&apos;
            </p>
          </header>
          <section className="modal-card-body ob-modal__body">
            <p>
              An error occurred while attempting to take a photo. Please click
              &quot;Okay&quot; below to try again. If the problem persists,
              please contact support.
            </p>
            {viewError && cameraError && (
              <div className="content has-margin-top-6">
                <blockquote>{cameraError.toString()}</blockquote>
              </div>
            )}
          </section>
          <footer className="modal-card-foot">
            <button
              type="button"
              className="button ob-button is-light cypress-view-error-button"
              onClick={toggleError}
            >
              View Details
            </button>
            <button
              type="button"
              className="button ob-button is-primary cypress-close-error-button"
              onClick={clearCameraError}
            >
              Okay
            </button>
          </footer>
        </div>
      </div>
    </>
  )
}

export default React.memo(FormElementCamera)

const annotationButtonColours = [
  '#000000',
  '#ffffff',
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#cddc39',
  '#ffee58',
  '#ffca28',
  '#ffa726',
  '#ff5722',
]

const CameraAnnotation = React.memo(function CameraAnnotation({
  imageSrc,
  onClose,
  onSave,
}: {
  imageSrc: unknown
  onClose: () => void
  onSave: (newValue: string) => void
}) {
  const annotationContentElementRef = React.useRef<HTMLDivElement>(null)
  const bmSignaturePadRef = React.useRef<HTMLDivElement>(null)
  const signatureCanvasRef = React.useRef<SignatureCanvas>(null)

  const [isDirty, setDirty] = useBooleanState(false)
  const [penColour, setPenColour] = React.useState(annotationButtonColours[0])

  const handleCancelAnnotation = React.useCallback(() => {
    if (signatureCanvasRef.current) {
      console.log('Clearing annotation...')
      signatureCanvasRef.current.clear()
    }
    onClose()
  }, [onClose])

  const handleSaveAnnotation = React.useCallback(() => {
    if (signatureCanvasRef.current) {
      onSave(signatureCanvasRef.current.toDataURL())
    }
  }, [onSave])

  // SETTING CANVAS FROM PASSED VALUE
  React.useEffect(() => {
    const annotationContentElement = annotationContentElementRef.current
    const bmSignaturePadElement = bmSignaturePadRef.current
    const signatureCanvas = signatureCanvasRef.current

    if (
      !annotationContentElement ||
      !bmSignaturePadElement ||
      !signatureCanvas ||
      typeof imageSrc !== 'string'
    ) {
      return
    }
    const canvasElement = signatureCanvas.getCanvas()

    // Disable scrolling to allow for smooth drawing
    scrollingService.disableScrolling()

    const maxWidth = annotationContentElement.clientWidth
    const maxHeight = annotationContentElement.clientHeight

    const i = new Image()
    i.onload = function () {
      const imageWidth = i.width
      const imageHeight = i.height
      let canvasWidth = imageWidth
      let canvasHeight = imageHeight

      if (imageWidth > maxWidth || imageHeight > maxHeight) {
        const widthRatio = maxWidth / imageWidth
        const heightRatio = maxHeight / imageHeight
        const ratio = Math.min(widthRatio, heightRatio)

        canvasWidth = ratio * imageWidth
        canvasHeight = ratio * imageHeight
      }

      bmSignaturePadElement.style.width = `${canvasWidth}px`
      bmSignaturePadElement.style.height = `${canvasHeight}px`
      bmSignaturePadElement.style.backgroundSize = 'cover'
      bmSignaturePadElement.style.backgroundImage = `url(${imageSrc})`
      canvasElement.width = canvasWidth
      canvasElement.height = canvasHeight
    }
    i.src = imageSrc

    return () => {
      scrollingService.enableScrolling()
    }
  }, [imageSrc])

  return (
    <div className="modal is-active">
      <div className="modal-background-faded"></div>
      <div className="ob-annotation">
        <div className="ob-annotation__buttons ob-annotation__buttons-colours">
          {annotationButtonColours.map((colour, index) => {
            return (
              <button
                key={index}
                type="button"
                className={clsx(
                  'button ob-annotation__button ob-annotation__button-colour cypress-annotation-colour-button',
                  {
                    'is-selected': penColour === colour,
                  },
                )}
                onClick={() => setPenColour(colour)}
                style={{ backgroundColor: colour }}
              />
            )
          })}
        </div>
        <div
          ref={annotationContentElementRef}
          className="ob-annotation__content"
        >
          <div
            ref={bmSignaturePadRef}
            className="ob-annotation__signature-pad cypress-annotation-signature-pad"
          >
            <SignatureCanvas
              ref={signatureCanvasRef}
              clearOnResize={false}
              // @ts-expect-error ???
              onEnd={setDirty}
              penColor={penColour}
            />
          </div>
        </div>
        <div className="ob-annotation__buttons ob-annotation__buttons-actions">
          <button
            type="button"
            className="button is-light ob-button ob-annotation__button ob-annotation__button-action cypress-annotation-cancel-button"
            onClick={handleCancelAnnotation}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button is-primary ob-button ob-annotation__button ob-annotation__button-action cypress-annotation-save-button"
            disabled={!isDirty}
            onClick={handleSaveAnnotation}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
})
