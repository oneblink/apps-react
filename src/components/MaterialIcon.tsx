import * as React from 'react'
import { Icon } from '@mui/material'
import clsx from 'clsx'

export default function MaterialIcon({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof Icon>) {
  return (
    <Icon
      ref={ref}
      role="img"
      className={clsx('ob-icon', className)}
      aria-hidden
      {...props}
    />
  )
}
