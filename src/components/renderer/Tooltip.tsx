import * as React from 'react'
import { Tooltip as MuiTooltip } from '@mui/material'
import useOneBlinkFormContainer from '../../hooks/useOneBlinkFormContainer'

function Tooltip({
  children,
  ...props
}: React.ComponentProps<typeof MuiTooltip>) {
  const container = useOneBlinkFormContainer()

  return (
    <MuiTooltip
      {...props}
      slotProps={{
        popper: { container: container.current, ...props.slotProps?.popper },
      }}
    >
      {children}
    </MuiTooltip>
  )
}

export default React.memo(Tooltip)
