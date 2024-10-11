import * as React from 'react'
import { Icon } from '@mui/material'
import clsx from 'clsx'

export default React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Icon>
>(function MaterialIcon({ className, ...props }, ref) {
  return (
    <Icon
      ref={ref}
      role="img"
      className={clsx('ob-icon', className)}
      aria-hidden
      {...props}
    />
  )
})
