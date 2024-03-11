import * as React from 'react'
import clsx from 'clsx'

export default function MaterialIcon({
  className,
  children,
  ...props
}: React.PropsWithChildren<
  { className?: string } & JSX.IntrinsicElements['i']
>) {
  return (
    <i className={clsx('material-icons', className)} aria-hidden {...props}>
      {children}
    </i>
  )
}
