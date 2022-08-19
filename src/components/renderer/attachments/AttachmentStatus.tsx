import * as React from 'react'
import { Tooltip } from '@mui/material'
import UploadingAttachment from './UploadingAttachment'

const AttachmentStatus = ({
  isUploading,
  isUploadPaused,
  uploadError,
  loadImageUrlError,
  isLoadingImageUrl,
  imageUrl,
}: {
  isUploading?: boolean
  isUploadPaused?: boolean
  uploadError?: Error
  loadImageUrlError?: Error
  isLoadingImageUrl?: boolean
  imageUrl: string | null | undefined
}) => {
  const tooltip = React.useMemo(() => {
    if (isLoadingImageUrl && !imageUrl) {
      return 'Attempting to load file preview. File is synced with submission.'
    }
    if (loadImageUrlError && !imageUrl) {
      return 'File preview not available, however file is synced with submission.'
    }

    return 'Synced with submission.'
  }, [imageUrl, isLoadingImageUrl, loadImageUrlError])

  if (uploadError) {
    return (
      <Tooltip title={uploadError.message}>
        <span className="attachment__status-wrapper">
          <i className="material-icons has-text-danger">error</i>
        </span>
      </Tooltip>
    )
  }

  if (isUploading) {
    if (isUploadPaused) {
      return (
        <span className="attachment__status-wrapper">
          <i className="material-icons">pause</i>
        </span>
      )
    }
    return <UploadingAttachment />
  }

  return (
    <Tooltip title={tooltip}>
      <span className="attachment__status-wrapper">
        <i className="material-icons has-text-success">check_circle</i>
      </span>
    </Tooltip>
  )
}

export default React.memo(AttachmentStatus)
