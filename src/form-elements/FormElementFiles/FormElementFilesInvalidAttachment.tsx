import * as React from 'react'
import { AttachmentError } from '../../types/attachments'

interface Props {
  file: AttachmentError
}

const FormElementFilesInvalidAttachment = ({ file }: Props) => {
  return (
    <div className="ob-files__upload-error">
      <i className="material-icons has-text-warning icon-small ob-files__upload-error-icon">
        error
      </i>
      <span>An error occurred uploading the file {`"${file.fileName}"`}.</span>
    </div>
  )
}

export default React.memo<Props>(FormElementFilesInvalidAttachment)
