import * as React from 'react'

import useBooleanState from '../hooks/useBooleanState'
import downloadAttachment, {
  downloadFileLegacy,
} from '../services/download-file'
import OnLoading from '../components/renderer/OnLoading'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import drawTimestampOnCanvas from '../services/drawTimestampOnCanvas'
import { FormElementBinaryStorageValue } from '../types/attachments'
import useAttachment from '../hooks/attachments/useAttachment'
import AnnotationModal from '../components/renderer/AnnotationModal'
import Modal from '../components/renderer/Modal'
import {
  checkIfContentTypeIsImage,
  prepareNewAttachment,
  correctFileOrientation,
} from '../services/attachments'
import AttachmentStatus from '../components/renderer/attachments/AttachmentStatus'
import { canvasToBlob, urlToBlobAsync } from '../services/blob-utils'
import ImagePreviewUnavailable from '../components/renderer/attachments/ImagePreviewUnavailable'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import ProgressBar from '../components/renderer/attachments/ProgressBar'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'

type Props = {
  id: string
  element: FormTypes.CameraElement
  value: FormElementBinaryStorageValue
  onChange: FormElementValueChangeHandler<FormElementBinaryStorageValue>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

function FormElementCamera({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const [{ cameraError, isLoading }, setState] = React.useState<{
    isLoading: boolean
    cameraError?: Error
  }>({
    isLoading: false,
  })
  const [isAnnotating, setIsAnnotating, clearIsAnnotating] =
    useBooleanState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const clearImage = React.useCallback(() => {
    onChange(element, {
      value: undefined,
    })
  }, [element, onChange])

  const fileChange = React.useCallback(
    async (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
      if (!changeEvent.target || !changeEvent.target.files) {
        return
      }

      const file = changeEvent.target.files[0]
      if (!file) {
        return
      }

      setState({
        isLoading: true,
      })

      console.log('File selected event', file)
      try {
        if (!checkIfContentTypeIsImage(file.type)) {
          throw new Error(
            `Invalid file type "${file.type}". Please select an image.`,
          )
        }
        const result = await correctFileOrientation(
          file,
          element.includeTimestampWatermark ? drawTimestampOnCanvas : undefined,
        )

        if (result instanceof Blob) {
          onChange(element, {
            value: prepareNewAttachment(result, file.name, element),
          })
        } else {
          const blob = await canvasToBlob(result)
          onChange(element, {
            value: prepareNewAttachment(blob, file.name, element),
          })
        }

        setIsDirty()
        setState({
          isLoading: false,
        })
      } catch (error) {
        setState({
          isLoading: false,
          cameraError: error as Error,
        })
      }
    },
    [element, onChange, setIsDirty],
  )
  const openCamera = React.useCallback(() => {
    if (window.cordova && navigator.camera && navigator.camera.getPicture) {
      setState({
        isLoading: true,
      })
      navigator.camera.getPicture(
        (base64Data: string) => {
          urlToBlobAsync(`data:image/jpeg;base64,${base64Data}`)
            .then((blob) => {
              onChange(element, {
                value: prepareNewAttachment(blob, 'photo.jpeg', element),
              })
              setState({
                isLoading: false,
              })
            })
            .catch((error) => {
              setState({
                cameraError: error,
                isLoading: false,
              })
            })
        },
        (error: Error) => {
          console.warn(
            'An error occurred while attempting to take a photo',
            error,
          )
          setState({
            isLoading: false,
            cameraError: error,
          })
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
      // RESET HTML FILE INPUT VALUE SO FILES PREVIOUSLY ADDED AND REMOVED ARE RECOGNIZED
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    } else {
      console.error(
        'Could not find "input" element in Camera component template',
      )
    }
  }, [element, onChange])

  const {
    isUploading,
    uploadErrorMessage,
    isLoadingImageUrl,
    imageUrl,
    loadImageUrlError,
    canDownload,
    progress,
  } = useAttachment(
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

  const handleDownload = React.useCallback(async () => {
    if (typeof value === 'string') {
      await downloadFileLegacy(value, id)
    } else if (value && value.type !== 'ERROR') {
      await downloadAttachment(value)
    }
  }, [value, id])

  const handleSaveAnnotation = React.useCallback(
    (annotationDataUri: string) => {
      clearIsAnnotating()

      if (typeof imageUrl !== 'string') {
        return
      }

      setState({
        isLoading: true,
      })

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

          try {
            canvasToBlob(canvas)
              .then((blob) => {
                const attachment = prepareNewAttachment(
                  blob,
                  'photo.png',
                  element,
                )
                onChange(element, {
                  value: attachment,
                })
                setState({
                  isLoading: false,
                })
              })
              .catch((error) => {
                setState({
                  cameraError: error,
                  isLoading: false,
                })
              })
          } catch (error) {
            setState({
              cameraError: error as Error,
              isLoading: false,
            })
          }
        }
        annotationImage.src = annotationDataUri
      }
      image.setAttribute('crossorigin', 'anonymous')
      image.src = imageUrl
    },
    [clearIsAnnotating, element, imageUrl, onChange],
  )

  const progressTooltipRef = React.useRef<HTMLDivElement>(null)
  return (
    <>
      <FormElementLabelContainer
        className="ob-camera"
        element={element}
        id={id}
        required={element.required}
      >
        <div className="control">
          {(value || isLoading) && (
            <>
              <figure className="ob-figure" ref={progressTooltipRef}>
                <DisplayImage
                  isUploading={isUploading}
                  uploadErrorMessage={uploadErrorMessage}
                  isLoadingImageUrl={isLoadingImageUrl}
                  imageUrl={imageUrl}
                  loadImageUrlError={loadImageUrlError}
                  isLoading={isLoading}
                  element={element}
                  onAnnotate={setIsAnnotating}
                  canDownload={canDownload}
                  progress={progress}
                />
                <ProgressBar isShowing={isUploading} progress={progress} />
              </figure>
            </>
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
            aria-describedby={ariaDescribedby}
          />
          <div className="buttons ob-buttons">
            {value ? (
              <>
                {uploadErrorMessage && handleRetry && (
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
                  className="button ob-button ob-button__clear is-light cypress-clear-camera"
                  onClick={clearImage}
                  disabled={element.readOnly || isLoading}
                >
                  Clear
                </button>
                {canDownload && (
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
                )}
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

      {isAnnotating && imageUrl && (
        <AnnotationModal
          imageSrc={imageUrl}
          onClose={clearIsAnnotating}
          onSave={handleSaveAnnotation}
        />
      )}

      {cameraError && (
        <Modal
          isOpen
          title="Whoops..."
          className="cypress-error-modal"
          titleClassName="cypress-error-title"
          actions={
            <button
              type="button"
              className="button ob-button is-primary cypress-close-error-button"
              onClick={() => setState({ isLoading: false })}
              autoFocus
            >
              Okay
            </button>
          }
        >
          <p>
            An error occurred while attempting to take a photo. Please click{' '}
            <b>Okay</b> below to try again. If the problem persists, please
            contact support.
          </p>

          <div className="content has-margin-top-6">
            <blockquote>{cameraError.toString()}</blockquote>
          </div>
        </Modal>
      )}
    </>
  )
}

export default React.memo(FormElementCamera)

const DisplayImage = React.memo(function DisplayImage({
  uploadErrorMessage,
  isUploading,
  isLoadingImageUrl,
  imageUrl,
  loadImageUrlError,
  isLoading,
  element,
  onAnnotate,
  progress,
}: ReturnType<typeof useAttachment> & {
  element: FormTypes.CameraElement
  isLoading: boolean
  onAnnotate: () => void
  progress: number | undefined
}) {
  if (uploadErrorMessage) {
    return (
      <div className="figure-content">
        <h3 className="title is-3">Upload Failed</h3>
        <p>
          Your photo failed to upload, please use the <b>Retry</b> or{' '}
          <b>Clear</b> buttons below.
        </p>
      </div>
    )
  }

  if (loadImageUrlError) {
    return (
      <div className="figure-content">
        <h3 className="title is-3">Preview Failed</h3>
        <p>{loadImageUrlError.message}</p>
      </div>
    )
  }

  if (isLoadingImageUrl || isLoading) {
    return (
      <div className="figure-content has-text-centered cypress-camera-loading-image">
        <OnLoading small />
      </div>
    )
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
          className="cypress-camera-image ob-camera__img"
          crossOrigin="anonymous"
          alt={`${element.label}: Attachment`}
        />
        <button
          type="button"
          className="button is-primary ob-camera__annotate-button cypress-annotate-button"
          onClick={onAnnotate}
          disabled={element.readOnly}
        >
          <span className="icon">
            <i className="material-icons">brush</i>
          </span>
        </button>
      </>
    )
  }

  return (
    <div className="figure-content">
      <ImagePreviewUnavailable />
    </div>
  )
})
