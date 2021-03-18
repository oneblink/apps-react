import * as React from 'react'
import clsx from 'clsx'

interface Props {
  onClick: () => void
  icon: string
  children: React.ReactNode
  isActive: boolean
  disabled: boolean
}

const ComplianceButton = ({
  onClick,
  icon,
  children,
  isActive,
  disabled,
}: Props) => {
  return (
    <button
      disabled={disabled}
      type="button"
      className={clsx('button compliance-button', {
        'is-primary': isActive,
        'is-light': !isActive,
      })}
      onClick={onClick}
    >
      <i className="material-icons is-size-5 compliance-button-icon">{icon}</i>
      {children}
    </button>
  )
}

export default React.memo<Props>(ComplianceButton)
