import * as React from 'react'
import { LinearProgress, Tooltip } from '@mui/material'

interface Props {
  progress: number | undefined
}

const ProgressBar = ({ progress }: Props) => {
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
      <LinearProgress
        className="ob-progress__attachment-bar"
        variant="determinate"
        value={progress || 0}
      />
    </div>
  )
}

export default React.memo<Props>(ProgressBar)
