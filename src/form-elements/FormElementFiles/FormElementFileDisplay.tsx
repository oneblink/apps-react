import * as React from 'react'
import { AttachmentValid } from '../../types/attachments'
import OnLoading from '../../components/OnLoading'
import { Tooltip } from '@material-ui/core'
import { checkIfContentTypeIsImage } from '../../services/attachments'
import useAttachment from '../../hooks/attachments/useAttachment'
import UploadingAttachment from '../../components/attachments/UploadingAttachment'
type Props = {
  attachment: AttachmentValid
} & ReturnType<typeof useAttachment>

const FormElementFileDisplay = ({
  attachment,
  imageUrl,
  isLoadingImageUrl,
  loadImageUrlError,
  isUploading,
}: Props) => {
  const isImageType = React.useMemo(() => {
    if (!attachment.type) {
      return checkIfContentTypeIsImage(attachment.contentType)
    }
    return checkIfContentTypeIsImage(attachment.data.type)
  }, [attachment])

  const loader = React.useMemo(() => {
    return (
      <div className="ob-files__content-loading">
        <OnLoading tiny />
      </div>
    )
  }, [])

  if (!isImageType) {
    return (
      <div className="ob-files__content-file has-text-centered">
        <i className="material-icons icon-large ob-files__attach-icon has-text-grey">
          attach_file
        </i>
      </div>
    )
  }
  // >>> IS IMAGE

  if (isUploading) {
    return <UploadingAttachment>{loader}</UploadingAttachment>
  }

  if (isLoadingImageUrl) {
    return loader
  }

  if (imageUrl) {
    return (
      <div className="ob-files__content-image">
        <img className="ob-files__image" src={imageUrl} />
      </div>
    )
  }

  // Show paperclip if image failed to load
  return (
    <Tooltip title="Preview Unavailable">
      <div className="ob-files__content-file has-text-centered">
        <i className="material-icons icon-large ob-files__attach-icon has-text-grey">
          attach_file
        </i>
      </div>
    </Tooltip>
  )
}

export default React.memo<Props>(FormElementFileDisplay)
