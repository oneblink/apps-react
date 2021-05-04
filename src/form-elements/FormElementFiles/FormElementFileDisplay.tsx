import * as React from 'react'
import { AttachmentValid } from '../../hooks/attachments/useAttachments'

interface Props {
  file: AttachmentValid
}

const FormElementFileDisplay = ({ file }: Props) => {
  const isImageType = React.useMemo(() => {
    if (!file.type) {
      return file.contentType.includes('image/')
    }
    return file.data.type.includes('image/')
  }, [file])
  const imageUrl = React.useMemo(() => {
    if (file.type === 'NEW' || file.type === 'SAVING') {
      return URL.createObjectURL(file.data)
    }
    if (!file.type) {
      // TODO: Load image
      return
    }
  }, [file])

  if (!isImageType) {
    return (
      <div className="ob-files__content-file has-text-centered">
        <i className="material-icons icon-large ob-files__attach-icon has-text-grey">
          attach_file
        </i>
      </div>
    )
  }
  // IS IMAGE
  if (file.type === 'SAVING' || file.type === 'NEW') {
    return (
      <div className="ob-files__content-image">
        <img className="ob-files__image" src={imageUrl} />
      </div>
    )
  }
  // TODO: Display image once loaded again?
  return <div className="ob-files__content-loading">Loaded!</div>

  // TODO: HANDLE SHOWING PAPER CLIP WHEN IMAGE DIDNT LOAD?

  // TODO: Show spinner while file is loading?
}

export default React.memo<Props>(FormElementFileDisplay)
