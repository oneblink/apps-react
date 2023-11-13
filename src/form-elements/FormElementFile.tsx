import * as React from 'react'
import downloadAttachment from '../services/download-file'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import useAttachment, { OnChange } from '../hooks/attachments/useAttachment'
import FileCard from '../components/renderer/attachments/FileCard'
import { attachmentsService } from '@oneblink/apps'
import { onUploadAttachmentConfiguration } from '../types/attachments'

type Props = {
  element: FormTypes.FilesElement
  onRemove: (id: string) => void
  file: attachmentsService.Attachment
  disableUpload: boolean
  onChange: OnChange
  onUploadAttachment?: (
    upload: onUploadAttachmentConfiguration,
    abortSignal?: AbortSignal,
  ) => Promise<SubmissionTypes.FormSubmissionAttachment>
}

const FormElementFile = ({
  element,
  onRemove,
  file,
  onChange,
  disableUpload,
  onUploadAttachment,
}: Props) => {
  const attachmentResult = useAttachment(
    file,
    element,
    onChange,
    onUploadAttachment,
    disableUpload,
  )

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
      loadImageUrlError={attachmentResult.loadImageUrlError}
      isLoadingImageUrl={attachmentResult.isLoadingImageUrl}
      imageUrl={attachmentResult.imageUrl}
      fileName={file.fileName}
      onDownload={attachmentResult.canDownload ? handleDownload : undefined}
      onRemove={handleRemove}
      onRetry={handleRetry}
      progress={attachmentResult.progress}
    />
  )
}

export default React.memo<Props>(FormElementFile)
