import * as React from 'react'
import { Tooltip as MuiTooltip } from '@mui/material'
import useOneBlinkFormContainer from '../../hooks/useOneBlinkFormContainer'

function Tooltip({
  children,
  title,
  ...props
}: React.ComponentProps<typeof MuiTooltip>) {
  const container = useOneBlinkFormContainer()

  if (!title) {
    return <>{children}</>
  }

  return (
    <MuiTooltip
      {...props}
      title={title}
      slotProps={{
        popper: { container: container.current, ...props.slotProps?.popper },
      }}
    >
      {children}
    </MuiTooltip>
  )
}

export default React.memo(Tooltip)
