import * as React from 'react'
import { ValidAttachment } from '../../hooks/useAttachments'
import OnLoading from '../../components/OnLoading'

interface Props {
  file: ValidAttachment
}

const FormElementFileDisplay = ({ file }: Props) => {
  const isImageType = React.useMemo(() => file.contentType.includes('image/'), [
    file,
  ])

  if (
    file.type === 'SAVING' ||
    file.type === 'READY' ||
    file.type === 'LOADING_FAILED'
  ) {
    if (!isImageType || file.type === 'LOADING_FAILED') {
      return (
        <div className="ob-files__content-file has-text-centered">
          <i className="material-icons icon-large ob-files__attach-icon has-text-grey">
            attach_file
          </i>
        </div>
      )
    }
    const imageUrl = URL.createObjectURL(file.data)
    return (
      <div className="ob-files__content-image">
        <img className="ob-files__image" src={imageUrl} />
      </div>
    )
  }

  // ONLY STATUS LEFT IS LOADING
  return (
    <div className="ob-files__content-loading">
      <OnLoading />
    </div>
  )
}

export default React.memo<Props>(FormElementFileDisplay)
