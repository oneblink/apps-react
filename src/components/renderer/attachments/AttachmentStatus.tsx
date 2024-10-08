import * as React from 'react'
import Tooltip from '../Tooltip'
import useIsOffline from '../../../hooks/useIsOffline'
import MaterialIcon from '../../MaterialIcon'

const AttachmentStatus = ({
  isUploading,
  isUploadPaused,
  uploadError,
  loadAttachmentUrlError,
  isLoadingAttachmentUrl,
  attachmentUrl,
  progress,
}: {
  isUploading?: boolean
  isUploadPaused?: boolean
  uploadError?: Error
  loadAttachmentUrlError?: Error
  isLoadingAttachmentUrl?: boolean
  attachmentUrl: string | null | undefined
  progress: number | undefined
}) => {
  const isOffline = useIsOffline()

  const tooltip = React.useMemo(() => {
    if (isLoadingAttachmentUrl && !attachmentUrl) {
      return 'Attempting to load file preview. File is synced with submission.'
    }
    if (loadAttachmentUrlError && !attachmentUrl) {
      return 'File preview not available, however file is synced with submission.'
    }

    return 'Synced with submission.'
  }, [attachmentUrl, isLoadingAttachmentUrl, loadAttachmentUrlError])

  if (uploadError) {
    return (
      <Tooltip title={uploadError.message} role="alert">
        <span className="attachment__status-wrapper">
          <MaterialIcon className="has-text-danger">error</MaterialIcon>
        </span>
      </Tooltip>
    )
  }

  if (isUploading) {
    if (isUploadPaused) {
      return (
        <span className="attachment__status-wrapper">
          <MaterialIcon>pause</MaterialIcon>
        </span>
      )
    }
    if (isOffline) {
      return (
        <Tooltip
          title="Upload will start when you connect to the internet"
          role="alert"
        >
          <div className="cypress-attachment-uploading">
            <MaterialIcon className="has-text-warning">wifi_off</MaterialIcon>
          </div>
        </Tooltip>
      )
    }
    return (
      <Tooltip title="Uploading">
        <div className="cypress-attachment-uploading" role="progressbar">
          {Math.round(progress || 0)}%
        </div>
      </Tooltip>
    )
  }

  return (
    <Tooltip title={tooltip}>
      <span className="attachment__status-wrapper">
        <MaterialIcon
          className="has-text-success"
          role="status"
          aria-label="upload successful"
        >
          check_circle
        </MaterialIcon>
      </span>
    </Tooltip>
  )
}

export default React.memo(AttachmentStatus)
