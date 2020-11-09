import * as React from 'react'
import clsx from 'clsx'

type Props = {
  className?: string
  small?: boolean
  large?: boolean
}

function OnLoading({ className, small, large }: Props) {
  return (
    <on-loading className={className}>
      <div
        className={clsx('ob-loading on-loading', {
          small: small,
          large: large,
        })}
      />
    </on-loading>
  )
}

export default React.memo(OnLoading)
