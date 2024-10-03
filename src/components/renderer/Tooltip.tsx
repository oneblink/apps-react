import * as React from 'react'
import { Tooltip as MuiTooltip } from '@mui/material'
import useOneBlinkFormContainer from '../../hooks/useOneBlinkFormContainer'

function Tooltip({
  children,
  ...props
}: React.PropsWithChildren<React.ComponentProps<typeof MuiTooltip>>) {
  const container = useOneBlinkFormContainer()

  return (
    <MuiTooltip {...props} PopperProps={{ container, ...props.PopperProps }}>
      {children}
    </MuiTooltip>
  )
}

export default React.memo(Tooltip)
