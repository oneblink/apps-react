import * as React from 'react'
import { AttachmentValid } from '../../hooks/attachments/useAttachments'
import OnLoading from '../../components/OnLoading'
import { Tooltip } from '@material-ui/core'
interface Props {
  attachment: AttachmentValid
  attachmentBlob: Blob | undefined
  isLoadingAttachmentBlob: boolean
}

const FormElementFileDisplay = ({
  attachment,
  attachmentBlob,
  isLoadingAttachmentBlob,
}: Props) => {
  const isImageType = React.useMemo(() => {
    if (!attachment.type) {
      return attachment.contentType.includes('image/')
    }
    return attachment.data.type.includes('image/')
  }, [attachment])
  const imageUrl = React.useMemo(() => {
    if (attachment.type === 'NEW' || attachment.type === 'SAVING') {
      return URL.createObjectURL(attachment.data)
    }
    if (!attachment.type && attachmentBlob) {
      return URL.createObjectURL(attachmentBlob)
    }
  }, [attachment, attachmentBlob])

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

  if (attachment.type === 'SAVING' || attachment.type === 'NEW') {
    return (
      <div className="ob-files__content-image">
        <img className="ob-files__image" src={imageUrl} />
      </div>
    )
  }

  if (isLoadingAttachmentBlob) {
    return (
      <div className="ob-files__content-loading">
        <OnLoading tiny />
      </div>
    )
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
