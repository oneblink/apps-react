import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import FileCardContent from './FileCardContent'
import AttachmentStatus from './AttachmentStatus'
import {
  checkFileNameIsValid,
  checkFileNameExtensionIsValid,
} from '../../../services/form-validation/validators'
import ProgressBar from './ProgressBar'
import DropdownMenu from './DropdownMenu'

type Props = {
  element: FormTypes.FilesElement
  isUploading?: boolean
  isUploadPaused?: boolean
  uploadErrorMessage?: string
  loadAttachmentUrlError?: Error
  isLoadingAttachmentUrl?: boolean
  isContentTypeImage?: boolean
  fileName: string
  attachmentUrl: string | undefined | null
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
  loadAttachmentUrlError,
  isLoadingAttachmentUrl,
  isContentTypeImage,
  attachmentUrl,
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
    <div className="column is-one-quarter-ob">
      <div className="ob-files__box">
        <div className="ob-files__content">
          <a
            href={attachmentUrl || ''}
            target="_blank"
            rel="noreferrer"
            className="cypress-file-download-button"
            style={{ pointerEvents: attachmentUrl ? 'auto' : 'none' }}
          >
            <FileCardContent
              attachmentUrl={attachmentUrl}
              alt={`${element.label}: Attachment ${index + 1}`}
              isContentTypeImage={isContentTypeImage}
            />
          </a>
        </div>
        <DropdownMenu
          element={element}
          onDownload={onDownload}
          onRetry={onRetry}
          onRemove={onRemove}
          attachmentUrl={attachmentUrl || ''}
        />

        <div className="ob-files__file-name is-size-6">
          <span className="ob-files__file-name-inner">{fileName}</span>
          <AttachmentStatus
            isUploading={isUploading}
            isUploadPaused={isUploadPaused}
            uploadError={uploadError}
            loadAttachmentUrlError={loadAttachmentUrlError}
            isLoadingAttachmentUrl={isLoadingAttachmentUrl}
            attachmentUrl={attachmentUrl}
            progress={progress}
          />
          <ProgressBar progress={progress} isShowing={!!isUploading} />
        </div>
      </div>
    </div>
  )
}

export default React.memo(FileCard)
