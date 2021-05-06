import * as React from 'react'
import { Tooltip } from '@material-ui/core'
import useAttachment from '../../hooks/attachments/useAttachment'
import UploadingAttachment from './UploadingAttachment'

const AttachmentStatus = ({
  isUploading,
  loadImageUrlError,
  isLoadingImageUrl,
  imageUrl,
}: ReturnType<typeof useAttachment>) => {
  const tooltip = React.useMemo(() => {
    if (isLoadingImageUrl && !imageUrl) {
      return 'Attempting to load file preview. File is synced with submission.'
    }
    if (loadImageUrlError && !imageUrl) {
      return 'File preview not available, however file is synced with submission.'
    }

    return 'Synced with submission.'
  }, [imageUrl, isLoadingImageUrl, loadImageUrlError])

  if (isUploading) return <UploadingAttachment />
  return (
    <Tooltip title={tooltip}>
      <span className="attachment__status-wrapper">
        <i className="material-icons has-text-success">check_circle</i>
      </span>
    </Tooltip>
  )
}

export default React.memo<ReturnType<typeof useAttachment>>(AttachmentStatus)
