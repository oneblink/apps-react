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
}

export const ModalContainerContext =
  React.createContext<React.RefObject<HTMLDivElement | null> | null>(null)

export function ModalContainerProvider({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const modalRef = React.useRef<HTMLDivElement>(null)

  return (
    <ModalContainerContext.Provider value={modalRef}>
      <div ref={modalRef} className={className}>
        {children}
      </div>
    </ModalContainerContext.Provider>
  )
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
}: Props) {
  const ref = React.useContext(ModalContainerContext)
  return (
    <MuiModal
      className={clsx('modal ob-modal', className, {
        'is-active': isOpen,
      })}
      open={isOpen}
      slots={{
        backdrop: () => <div className="modal-background-faded"></div>,
      }}
      container={ref?.current}
      disableScrollLock={true}
    >
      <div className={clsx('modal-card', cardClassName)}>
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
