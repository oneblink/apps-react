import { LinearProgress, LinearProgressProps } from '@mui/material'
import * as React from 'react'

const ProgressBar = ({
  progress,
  ...rest
}: Omit<LinearProgressProps, 'value' | 'variant'> & {
  progress: number
}) => {
  return <LinearProgress {...rest} variant="determinate" value={progress} />
}

/**
 * @param props
 * @returns
 * @group Components
 */
export default React.memo(ProgressBar)
