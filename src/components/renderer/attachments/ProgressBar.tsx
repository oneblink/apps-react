import * as React from 'react'
import { Fade } from '@mui/material'
import ProgressBar from '../ProgressBar'

interface Props {
  progress: number | undefined
  isShowing: boolean
}

const AttachmentProgressBar = ({ progress, isShowing }: Props) => {
  return (
    <Fade in={isShowing}>
      <span>
        <div className="ob-progress__attachment-wrapper">
          <ProgressBar
            className="ob-progress__attachment-bar"
            progress={progress || 0}
          />
        </div>
      </span>
    </Fade>
  )
}

export default React.memo<Props>(AttachmentProgressBar)
