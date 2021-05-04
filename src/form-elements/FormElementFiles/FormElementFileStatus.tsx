import * as React from 'react'
import { AttachmentValid } from '../../hooks/attachments/useAttachments'
import OnLoading from '../../components/OnLoading'
import { Tooltip } from '@material-ui/core'
interface Props {
  file: AttachmentValid
}
const FormElementFileStatus = ({ file }: Props) => {
  const tooltip = React.useMemo(() => {
    if (file.type === 'SAVING') {
      return 'Saving file...'
    }
    return 'Synced with submission.'
  }, [file.type])

  if (file.type === 'SAVING') {
    return (
      <Tooltip title={tooltip}>
        <span className="ob-files__status-wrapper">
          <OnLoading tiny />
        </span>
      </Tooltip>
    )
  }
  // TODO: Display something for image that failed to load?

  return (
    <Tooltip title={tooltip}>
      <span className="ob-files__status-wrapper">
        <i className="material-icons has-text-success">check_circle</i>
      </span>
    </Tooltip>
  )
}

export default React.memo<Props>(FormElementFileStatus)
