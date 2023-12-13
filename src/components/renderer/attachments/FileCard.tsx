import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import FileCardContent from './FileCardContent'
import AttachmentStatus from './AttachmentStatus'
import {
  checkFileNameIsValid,
  checkFileNameExtensionIsValid,
} from '../../../services/form-validation'
import ProgressBar from './ProgressBar'
import DropdownMenu from './DropdownMenu'

type Props = {
  element: FormTypes.FilesElement
  isUploading?: boolean
  isUploadPaused?: boolean
  uploadErrorMessage?: string
  loadImageUrlError?: Error
  isLoadingImageUrl?: boolean
  fileName: string
  imageUrl: string | undefined | null
  onRemove: () => void
  onDownload?: () => void
  onRetry?: () => void
  progress: undefined | number
  index: number
}

function FileCard({
  element,
  isUploading,
  isUploadPaused,
  uploadErrorMessage,
  loadImageUrlError,
  isLoadingImageUrl,
  imageUrl,
  fileName,
  onDownload,
  onRemove,
  onRetry,
  progress,
  index,
}: Props) {
  const uploadError = React.useMemo(() => {
    if (!checkFileNameIsValid(element, fileName)) {
      return new Error(`${fileName.split('.').pop()} files are not allowed`)
    }
    if (!checkFileNameExtensionIsValid(element, fileName)) {
      return new Error(`${fileName} must have an extension`)
    }
    if (uploadErrorMessage) {
      return new Error(uploadErrorMessage)
    }
  }, [element, fileName, uploadErrorMessage])

  return (
    <div className="column is-one-quarter">
      <div className="ob-files__box">
        <div className="ob-files__content">
          <FileCardContent
            imageUrl={imageUrl}
            alt={`${element.label}: Attachment ${index + 1}`}
          />
        </div>
        <DropdownMenu
          element={element}
          onDownload={onDownload}
          onRetry={onRetry}
          onRemove={onRemove}
        />

        <div className="ob-files__file-name is-size-6">
          <span className="ob-files__file-name-inner">{fileName}</span>
          <AttachmentStatus
            isUploading={isUploading}
            isUploadPaused={isUploadPaused}
            uploadError={uploadError}
            loadImageUrlError={loadImageUrlError}
            isLoadingImageUrl={isLoadingImageUrl}
            imageUrl={imageUrl}
            progress={progress}
          />
          <ProgressBar progress={progress} isShowing={!!isUploading} />
        </div>
      </div>
    </div>
  )
}

export default React.memo(FileCard)
