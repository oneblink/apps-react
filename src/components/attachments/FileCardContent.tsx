import * as React from 'react'

const FileCardContent = ({
  imageUrl,
}: {
  imageUrl: string | undefined | null
}) => {
  if (imageUrl) {
    return (
      <div className="ob-files__content-image">
        <img className="ob-files__image" src={imageUrl} />
      </div>
    )
  }

  return (
    <div className="ob-files__content-file has-text-centered">
      <i className="material-icons icon-large ob-files__attach-icon has-text-grey">
        attach_file
      </i>
    </div>
  )
}

export default React.memo(FileCardContent)
