import * as React from 'react'
import clsx from 'clsx'

type Props = {
  className: string
  label: string
  isDisabled?: boolean
  isLoading?: boolean
  onClick: () => unknown
}

function ReceiptButton({
  className,
  label,
  isDisabled,
  isLoading,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      className={clsx('button ob-button ob-receipt__button', className, {
        'is-loading': isLoading,
      })}
      disabled={isLoading || isDisabled}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default React.memo(ReceiptButton)
