import * as React from 'react'
import { Tooltip } from '@mui/material'
import useIsOffline from '../../../hooks/useIsOffline'
import OnLoading from '../OnLoading'

const AttachmentStatus = ({
  isUploading,
  isUploadPaused,
  uploadError,
  loadImageUrlError,
  isLoadingImageUrl,
  imageUrl,
  progress,
}: {
  isUploading?: boolean
  isUploadPaused?: boolean
  uploadError?: Error
  loadImageUrlError?: Error
  isLoadingImageUrl?: boolean
  imageUrl: string | null | undefined
  progress: number | undefined
}) => {
  const isOffline = useIsOffline()

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
    if (isOffline) {
      return (
        <Tooltip title="Upload will start when you connect to the internet">
          <div className="cypress-attachment-uploading">
            <i className="material-icons has-text-warning">wifi_off</i>
          </div>
        </Tooltip>
      )
    }
    return (
      <Tooltip
        title={
          typeof progress === 'number'
            ? `Attachment upload progress: ${Math.round(progress)}%`
            : 'Preparing attachment for upload'
        }
      >
        <div className="cypress-attachment-uploading">
          <OnLoading tiny />
        </div>
      </Tooltip>
    )
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
