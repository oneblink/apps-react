import * as React from 'react'
import clsx from 'clsx'
import { Fade, Modal as MuiModal } from '@mui/material'

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
      onTransitionEnter={() => {
        // set the initial focused element
        const modalContentElement = modalContentRef.current
        if (modalContentElement) {
          const primaryControls = modalContentElement.querySelectorAll(
            '.ob-button.is-primary',
          )
          if (primaryControls[0] instanceof HTMLElement) {
            primaryControls[0].focus()
          }
        }
      }}
    >
      <Fade in={isOpen}>
        <div
          className={clsx('modal-card', cardClassName)}
          ref={modalContentRef}
        >
          {title && (
            <header className="modal-card-head">
              <p className={clsx('modal-card-title', titleClassName)}>
                {title}
              </p>
            </header>
          )}
          <section className={clsx('modal-card-body', bodyClassName)}>
            {children}
          </section>
          {actions && <footer className="modal-card-foot">{actions}</footer>}
        </div>
      </Fade>
    </MuiModal>
  )
}

export default React.memo(Modal)
