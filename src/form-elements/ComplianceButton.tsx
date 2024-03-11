import * as React from 'react'
import clsx from 'clsx'
import MaterialIcon from '../components/MaterialIcon'

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
      className={clsx('button ob-button__compliance', {
        'is-primary': isActive,
        'is-light': !isActive,
      })}
      onClick={onClick}
    >
      <MaterialIcon className="is-size-5 ob-button__compliance-icon">
        {icon}
      </MaterialIcon>
      {children}
    </button>
  )
}

export default React.memo<Props>(ComplianceButton)
