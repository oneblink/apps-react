import { LinearProgress, LinearProgressProps } from '@mui/material'
import * as React from 'react'

interface Props extends Omit<LinearProgressProps, 'value' | 'variant'> {
  progress: number
}

const ProgressBar = ({ progress, ...rest }: Props) => {
  return <LinearProgress {...rest} variant="determinate" value={progress} />
}

export default React.memo<Props>(ProgressBar)
