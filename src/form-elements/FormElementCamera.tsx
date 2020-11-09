import * as React from 'react'
import clsx from 'clsx'
import loadImage from 'blueimp-load-image'
import SignatureCanvas from 'react-signature-canvas'

import useBooleanState from '../hooks/useBooleanState'
import downloadFile from '../services/download-file'
import OnLoading from '../components/OnLoading'
import scrollingService from '../services/scrolling-service'
import { FormTypes } from '@oneblink/types'

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
    onChange(element, undefined)
  }, [element, onChange])
  const fileChange = React.useCallback(
    (changeEvent) => {
      if (
        changeEvent.target &&
        changeEvent.target.files &&
        changeEvent.target.files[0]
      ) {
        setIsLoading()
        clearImage()

        console.log('File selected event', changeEvent)
        // Unfortunately, photos taken from a native camera can come in with an incorrect
        // orientation. Luckily, we are not the only people in the work have this issue
        // and someone else has already solved with this nice library.
        // https://nsulistiyawan.github.io/2016/07/11/Fix-image-orientation-with-Javascript.html
        const file = changeEvent.target.files[0]
        loadImage.parseMetaData(file, function (data) {
          const options = {
            // should be set to canvas : true to activate auto fix orientation
            canvas: true,
            // @ts-expect-error if exif data available, update orientation
            orientation: data.exif ? data.exif.get('Orientation') : 0,
          }
          console.log('Loading image onto canvas to correct orientation')
          loadImage(
            file,
            (canvas) => {
              // @ts-expect-error this it always be a HTMLCanvasElement because we passed `canvas: true` above
              const base64data = canvas.toDataURL(file.type)
              setIsDirty()
              onChange(element, base64data)
              clearIsLoading()
            },
            options,
          )
        })
      }
    },
    [element, onChange, setIsLoading, setIsDirty, clearIsLoading, clearImage],
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
      <div className="ob-form__element ob-camera">
        <label
          htmlFor={id}
          className={clsx('label ob-label', {
            'is-required': element.required,
          })}
        >
          {element.label}
        </label>
        <div className="control">
          {!isLoading && value !== undefined && (
            <figure>
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
            <figure>
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
          <div role="alert">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
      </div>

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
            {viewError && (
              <div className="content has-margin-top-6">
                <blockquote>{cameraError}</blockquote>
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
              // @ts-expect-error
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
