import * as React from 'react'
import { LinearProgress } from '@mui/material'

interface Props {
  progress: number | undefined
}

const ProgressBar = ({ progress }: Props) => {
  return (
    <LinearProgress
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
      }}
      variant="determinate"
      value={progress || 0}
    />
  )
}

export default React.memo<Props>(ProgressBar)
