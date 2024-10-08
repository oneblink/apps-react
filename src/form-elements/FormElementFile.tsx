import * as React from 'react'
import downloadAttachment from '../services/download-file'
import { FormTypes } from '@oneblink/types'
import useAttachment, { OnChange } from '../hooks/attachments/useAttachment'
import FileCard from '../components/renderer/attachments/FileCard'
import { attachmentsService } from '@oneblink/apps'

type Props = {
  element: FormTypes.FilesElement
  onRemove: (id: string) => void
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
  const attachmentResult = useAttachment(file, element, onChange, disableUpload)

  const handleRemove = React.useCallback(() => {
    if (!file.type) {
      return onRemove(file.id)
    }
    return onRemove(file._id)
  }, [file, onRemove])

  const handleDownload = React.useCallback(async () => {
    await downloadAttachment(file)
  }, [file])

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
    <FileCard
      element={element}
      isUploading={attachmentResult.isUploading}
      isUploadPaused={disableUpload}
      uploadErrorMessage={attachmentResult.uploadErrorMessage}
      loadAttachmentUrlError={attachmentResult.loadAttachmentUrlError}
      isLoadingAttachmentUrl={attachmentResult.isLoadingAttachmentUrl}
      attachmentUrl={attachmentResult.attachmentUrl}
      isContentTypeImage={attachmentResult.isContentTypeImage}
      fileName={file.fileName}
      onDownload={attachmentResult.canDownload ? handleDownload : undefined}
      onRemove={handleRemove}
      onRetry={handleRetry}
      progress={attachmentResult.progress}
      index={index}
    />
  )
}

export default React.memo<Props>(FormElementFile)
