import * as React from 'react'
import clsx from 'clsx'
import { Modal as MuiModal } from '@mui/material'

type Props = {
  isOpen: boolean
  title?: string
  children: React.ReactNode
  actions: React.ReactNode | null
  className?: string
  cardClassName?: string
  titleClassName?: string
  bodyClassName?: string
  disableAutoFocus?: boolean
}

function Modal({
  isOpen,
  title,
  children,
  className,
  cardClassName,
  titleClassName,
  bodyClassName,
  actions,
  disableAutoFocus,
}: Props) {
  const modalContentRef = React.useRef<HTMLDivElement>(null)

  return (
    <MuiModal
      className={clsx('modal ob-modal', className, {
        'is-active': isOpen,
      })}
      open={isOpen}
      slots={{
        backdrop: () => <div className="modal-background-faded"></div>,
      }}
      disableAutoFocus={!!disableAutoFocus}
    >
      <div className={clsx('modal-card', cardClassName)} ref={modalContentRef}>
        {title && (
          <header className="modal-card-head">
            <p className={clsx('modal-card-title', titleClassName)}>{title}</p>
          </header>
        )}
        <section className={clsx('modal-card-body', bodyClassName)}>
          {children}
        </section>
        {actions && <footer className="modal-card-foot">{actions}</footer>}
      </div>
    </MuiModal>
  )
}

export default React.memo(Modal)
