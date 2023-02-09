import * as React from 'react'
import clsx from 'clsx'

type Props = {
  className: string
  containerClassName: string
  children: React.ReactNode
}

function Receipt({ className, containerClassName, children }: Props) {
  return (
    <section className={clsx('ob-receipt', className)}>
      <div className={clsx('ob-receipt__container', containerClassName)}>
        {children}
      </div>
    </section>
  )
}

export default React.memo(Receipt)
