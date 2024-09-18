import * as React from 'react'
import clsx from 'clsx'

type Props = {
  className?: string
  small?: boolean
  large?: boolean
  tiny?: boolean
}

function OnLoading({ className, small, large, tiny }: Props) {
  return (
    <on-loading className={className} role="progressbar">
      <div
        className={clsx('ob-loading on-loading', {
          small: small,
          large: large,
          tiny: tiny,
        })}
      />
    </on-loading>
  )
}

export default React.memo(OnLoading)
