import * as React from 'react'
import MaterialIcon from '../../MaterialIcon'

const FileCardContent = ({
  imageUrl,
  alt,
}: {
  imageUrl: string | undefined | null
  alt: string
}) => {
  if (imageUrl) {
    return (
      <div className="ob-files__content-image">
        <img className="ob-files__image" src={imageUrl} alt={alt} />
      </div>
    )
  }

  return (
    <div className="ob-files__content-file has-text-centered">
      <MaterialIcon className="icon-large ob-files__attach-icon has-text-grey">
        attach_file
      </MaterialIcon>
    </div>
  )
}

export default React.memo(FileCardContent)
