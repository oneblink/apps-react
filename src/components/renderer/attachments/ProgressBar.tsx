import * as React from 'react'
import { Tooltip, Fade } from '@mui/material'
import ProgressBar from '../ProgressBar'
import useBooleanState from '../../../hooks/useBooleanState'

interface Props {
  progress: number | undefined
  isShowing: boolean
  tooltipAnchorEl?: HTMLDivElement
}

const AttachmentProgressBar = ({
  progress,
  isShowing,
  tooltipAnchorEl,
}: Props) => {
  const [tooltipIsOpen, openTooltip, closeTooltip] = useBooleanState(false)
  React.useEffect(() => {
    if (tooltipAnchorEl && isShowing) {
      console.log('Applying tooltip events...')
      tooltipAnchorEl.onmouseenter = openTooltip
      tooltipAnchorEl.onmouseleave = closeTooltip
    }
    if (!isShowing) {
      closeTooltip()
    }
    return () => {
      if (tooltipAnchorEl) {
        console.log('Removing tooltip events...')
        tooltipAnchorEl.onmouseenter = null
        tooltipAnchorEl.onmouseleave = null
      }
    }
  }, [closeTooltip, isShowing, openTooltip, tooltipAnchorEl])
  return (
    <Fade in={isShowing}>
      <span>
        <div className="ob-progress__attachment-wrapper">
          <Tooltip
            title={
              typeof progress === 'number'
                ? `Attachment upload progress: ${Math.round(progress)}%`
                : ''
            }
            open={tooltipIsOpen}
          >
            <span className="ob-progress__attachment-tooltip-element" />
          </Tooltip>
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
