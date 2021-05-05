import * as React from 'react'

import useBooleanState from '../hooks/useBooleanState'
import { downloadFileLegacy } from '../services/download-file'
import OnLoading from '../components/OnLoading'
import { FormTypes } from '@oneblink/types'
import { localisationService } from '@oneblink/apps'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import { parseFilesAsAttachmentsLegacy } from '../services/parseFilesAsAttachments'
import { FormElementBinaryStorageValue } from '../types/attachments'
import useAttachment from '../hooks/attachments/useAttachment'
import AnnotationModal from '../components/AnnotationModal'
import useIsOffline from '../hooks/useIsOffline'
import UploadingAttachment from '../components/attachments/UploadingAttachment'
import Modal from '../components/Modal'
import { prepareNewAttachment } from '../services/attachments'

type Props = {
  id: string
  element: FormTypes.CameraElement
  value: FormElementBinaryStorageValue
  onChange: FormElementValueChangeHandler<FormElementBinaryStorageValue>
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementCamera({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [{ cameraError, isLoading }, setState] = React.useState<{
    isLoading: boolean
    cameraError?: Error
  }>({
    isLoading: false,
  })
  const [isDirty, setIsDirty] = useBooleanState(false)
  const [isAnnotating, setIsAnnotating, clearIsAnnotating] = useBooleanState(
    false,
  )
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const setBase64DataUri = React.useCallback(
    async (dataUri) => {
      if (!element.storageType || element.storageType === 'legacy') {
        onChange(element, dataUri)
        return
      }

      // Convert base64 data uri to blob and send it on its way
      const response = await fetch(dataUri)
      const blob = await response.blob()
      onChange(element, prepareNewAttachment(blob, 'photo.png', element))
    },
    [element, onChange],
  )

  const clearImage = React.useCallback(() => {
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

      setState({
        isLoading: true,
      })

      console.log('File selected event', changeEvent)
      try {
        const attachments = await parseFilesAsAttachmentsLegacy(
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
          await setBase64DataUri(attachments[0].data)
        }
        setState({
          isLoading: false,
        })
      } catch (error) {
        setState({
          isLoading: false,
          cameraError: error,
        })
      }
    },
    [element.includeTimestampWatermark, setBase64DataUri, setIsDirty],
  )
  const openCamera = React.useCallback(() => {
    if (window.cordova && navigator.camera && navigator.camera.getPicture) {
      setState({
        isLoading: true,
      })
      navigator.camera.getPicture(
        (base64Data: string) => {
          setBase64DataUri(`data:image/jpeg;base64,${base64Data}`)
            .then(() => {
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
  }, [setBase64DataUri])

  const {
    isUploading,
    uploadErrorMessage,
    isLoadingImageUrl,
    imageUrl,
    loadImageUrlError,
  } = useAttachment(
    value,
    element,
    React.useCallback(
      (id, attachment) => {
        onChange(element, attachment)
      },
      [element, onChange],
    ),
  )

  const handleDownload = React.useCallback(async () => {
    if (typeof value === 'string') {
      await downloadFileLegacy(value, id)
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
            const base64Data = canvas.toDataURL()
            setBase64DataUri(base64Data)
              .then(() => {
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
              cameraError: error,
              isLoading: false,
            })
          }
        }
        annotationImage.src = annotationDataUri
      }
      image.src = imageUrl
    },
    [clearIsAnnotating, imageUrl, setBase64DataUri],
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
          {(value || isLoading) && (
            <figure className="ob-figure">
              <DisplayImage
                isUploading={isUploading}
                uploadErrorMessage={uploadErrorMessage}
                isLoadingImageUrl={isLoadingImageUrl}
                imageUrl={imageUrl}
                loadImageUrlError={loadImageUrlError}
                isLoading={isLoading}
                element={element}
                onAnnotate={setIsAnnotating}
              />
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
}: ReturnType<typeof useAttachment> & {
  element: FormTypes.CameraElement
  isLoading: boolean
  onAnnotate: () => void
}) {
  const isOffline = useIsOffline()

  if (uploadErrorMessage) {
    return (
      <div className="figure-content">
        <h3 className="title is-3">Upload Failed</h3>
        <p>
          Your photo failed to upload, please press the <b>Clear</b> button and
          try again.
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
        {isUploading && <UploadingAttachment />}
        <img src={imageUrl} className="cypress-camera-image ob-camera__img" />
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

  if (isOffline) {
    return <p>Preview cannot be loaded while offline</p>
  }

  return <p>Preview could not be loaded</p>
})
