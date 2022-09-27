import { LinearProgress } from '@mui/material'
import * as React from 'react'

interface Props {
  progress: number
  className?: string
}

const ProgressBar = ({ progress, className }: Props) => {
  return (
    <LinearProgress
      className={className}
      variant="determinate"
      value={progress}
    />
  )
}

export default React.memo<Props>(ProgressBar)
