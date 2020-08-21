// @flow
'use strict'

import * as React from 'react'
import clsx from 'clsx'

type Props = {
  isOpen: boolean,
  title: string,
  children: React.Node,
  actions: React.Node | null,
  className?: string,
  cardClassName?: string,
  titleClassName?: string,
  bodyClassName?: string,
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
  return (
    <div
      className={clsx('modal ob-modal', className, {
        'is-active': isOpen,
      })}
    >
      <div className="modal-background-faded"></div>
      <div className={clsx('modal-card', cardClassName)}>
        <header className="modal-card-head">
          <p className={clsx('modal-card-title', titleClassName)}>{title}</p>
        </header>
        <section className={clsx('modal-card-body', bodyClassName)}>
          {children}
        </section>
        {actions && <footer className="modal-card-foot">{actions}</footer>}
      </div>
    </div>
  )
}

export default React.memo<Props>(Modal)
