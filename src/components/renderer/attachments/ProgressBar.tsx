import * as React from 'react'
import { Tooltip } from '@mui/material'
import ProgressBar from '../ProgressBar'

interface Props {
  progress: number | undefined
}

const AttachmentProgressBar = ({ progress }: Props) => {
  return (
    <div className="ob-progress__attachment-wrapper">
      <Tooltip
        title={
          typeof progress === 'number'
            ? `Attachment upload progress: ${Math.round(progress)}%`
            : ''
        }
      >
        <span className="ob-progress__attachment-tooltip-element" />
      </Tooltip>
      <ProgressBar
        className="ob-progress__attachment-bar"
        progress={progress || 0}
      />
    </div>
  )
}

export default React.memo<Props>(AttachmentProgressBar)
