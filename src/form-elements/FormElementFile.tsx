import * as React from 'react'
import downloadAttachment from '../services/download-file'
import { FormTypes } from '@oneblink/types'
import useAttachment, { OnChange } from '../hooks/attachments/useAttachment'
import FileCard from '../components/renderer/attachments/FileCard'
import { attachmentsService } from '../apps'
import useBooleanState from '../hooks/useBooleanState'
import CropModal from '../components/ImageCropper/CropModal'
import AnnotationModal, {
  superimposeAnnotationOnImage,
} from '../components/renderer/AnnotationModal'
import { generateCroppedImageBlob } from '../components/ImageCropper'
import { prepareNewAttachment } from '../services/attachments'
import Modal from '../components/renderer/Modal'
import { PercentCrop } from 'react-image-crop'

type Props = {
  element: FormTypes.FilesElement
  /** If set to `undefined`, the remove button will be hidden */
  onRemove: ((id: string) => void) | undefined
  file: attachmentsService.Attachment
  disableUpload: boolean
  onChange: OnChange
  index: number
}

const FormElementFile = ({
  element,
  onRemove,
  file,
  onChange,
  disableUpload,
  index,
}: Props) => {
  const [isAnnotating, setIsAnnotating, clearIsAnnotating] =
    useBooleanState(false)
  const [isCropping, setIsCropping, clearIsCropping] = useBooleanState(false)
  const [state, setState] = React.useState<{
    isLoading: boolean
    error?: Error
  }>({
    isLoading: false,
    error: undefined,
  })
  const {
    attachmentUrl,
    contentType,
    isUploading,
    uploadErrorMessage,
    isLoadingAttachmentUrl,
    loadAttachmentUrlError,
    isContentTypeImage,
    canDownload,
    progress,
  } = useAttachment(file, element, onChange, disableUpload)

  const handleRemove = React.useMemo(() => {
    if (!onRemove) {
      return
    }
    return () => {
      if (!file.type) {
        return onRemove(file.id)
      }
      return onRemove(file._id)
    }
  }, [file, onRemove])

  const handleDownload = React.useCallback(async () => {
    await downloadAttachment(file)
  }, [file])

  const handleAnnotate = React.useCallback(
    async (annotationDataUri: string) => {
      if (!attachmentUrl || file.type) return
      clearIsAnnotating()

      setState({
        isLoading: true,
      })

      try {
        const blob = await superimposeAnnotationOnImage({
          annotationDataUri,
          attachmentUrl,
        })
        setState({
          isLoading: false,
        })
        if (!blob) return
        const attachment = prepareNewAttachment(blob, file.fileName, element)
        onChange(file.id, attachment)
      } catch (error) {
        setState({
          error: error as Error,
          isLoading: false,
        })
      }
    },
    [attachmentUrl, clearIsAnnotating, element, file, onChange],
  )
  const handleSaveCrop = React.useCallback(
    async (croppedAreaPercent: PercentCrop) => {
      if (!attachmentUrl || file.type) return
      clearIsCropping()

      setState({
        isLoading: true,
      })

      try {
        const croppedImage = await generateCroppedImageBlob({
          croppedAreaPercent,
          imgSrc: attachmentUrl,
          fileType: contentType,
        })
        setState({
          isLoading: false,
        })
        if (!croppedImage) return
        const attachment = prepareNewAttachment(
          croppedImage,
          file.fileName,
          element,
        )
        onChange(file.id, attachment)
      } catch (error) {
        setState({
          error: error as Error,
          isLoading: false,
        })
      }
    },
    [attachmentUrl, clearIsCropping, contentType, element, file, onChange],
  )
  const handleRetry = React.useMemo(() => {
    if (file.type === 'ERROR' && file.data) {
      return () => {
        onChange(file._id, {
          type: 'NEW',
          _id: file._id,
          data: file.data,
          fileName: file.fileName,
          isPrivate: file.isPrivate,
        })
      }
    }
  }, [file, onChange])

  return (
    <>
      <FileCard
        element={element}
        isUploading={isUploading}
        isUploadPaused={disableUpload}
        uploadErrorMessage={uploadErrorMessage}
        loadAttachmentUrlError={loadAttachmentUrlError}
        isLoadingAttachmentUrl={isLoadingAttachmentUrl || state.isLoading}
        attachmentUrl={attachmentUrl}
        isContentTypeImage={isContentTypeImage}
        fileName={file.fileName}
        onDownload={canDownload ? handleDownload : undefined}
        onRemove={handleRemove}
        onRetry={handleRetry}
        progress={progress}
        index={index}
        onAnnotate={isContentTypeImage ? setIsAnnotating : undefined}
        onCrop={isContentTypeImage ? setIsCropping : undefined}
      />
      {isCropping && attachmentUrl && (
        <CropModal
          imageSrc={attachmentUrl}
          onClose={clearIsCropping}
          onSave={handleSaveCrop}
        />
      )}
      {isAnnotating && attachmentUrl && (
        <AnnotationModal
          imageSrc={attachmentUrl}
          onClose={clearIsAnnotating}
          onSave={handleAnnotate}
        />
      )}
      {state.error && (
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
            An error occurred while attempting to edit an image. Please click{' '}
            <b>Okay</b> below to try again. If the problem persists, please
            contact support.
          </p>

          <div className="content has-margin-top-6">
            <blockquote>{state.error.toString()}</blockquote>
          </div>
        </Modal>
      )}
    </>
  )
}

export default React.memo<Props>(FormElementFile)
