import * as React from 'react'
import { ValidAttachment } from '../../hooks/useAttachments'
import OnLoading from '../../components/OnLoading'
import { Tooltip } from '@material-ui/core'
interface Props {
  file: ValidAttachment
}
const FormElementFileStatus = ({ file }: Props) => {
  const tooltip = React.useMemo(() => {
    if (file.type === 'LOADING') {
      return 'Loading file...'
    }
    if (file.type === 'SAVING') {
      return 'Saving file...'
    }
    if (file.type === 'LOADING_FAILED') {
      return 'Preview Unavailable.'
    }
    return 'Synced with submission.'
  }, [file.type])

  if (file.type === 'LOADING' || file.type === 'SAVING') {
    return (
      <Tooltip title={tooltip}>
        <span className="ob-files__status-wrapper">
          <OnLoading tiny />
        </span>
      </Tooltip>
    )
  }
  if (file.type === 'LOADING_FAILED') {
    return (
      <Tooltip title={tooltip}>
        <span className="ob-files__status-wrapper">
          <i className="material-icons">info</i>
        </span>
      </Tooltip>
    )
  }
  return (
    <span className="ob-files__status-wrapper">
      <i className="material-icons has-text-success">check_circle</i>
    </span>
  )
}

export default React.memo<Props>(FormElementFileStatus)
