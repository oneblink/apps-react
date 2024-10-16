import * as React from 'react'
import { Icon } from '@mui/material'
import clsx from 'clsx'

export default React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Icon>
>(function MaterialIcon(
  // We declare the prop types again here because it
  // changes the way the type dec file is generated,
  // mitigating a type check error in the forms-cdn repo.
  { className, ...props }: React.ComponentProps<typeof Icon>,
  ref,
) {
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
