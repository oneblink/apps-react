import * as React from 'react'
import clsx from 'clsx'

export function Clickable({
  disabled,
  onClick,
  ...props
}: React.ComponentProps<'div'> & {
  disabled?: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  return (
    <div
      {...props}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      ref={ref}
      onKeyDown={(event) => {
        if (disabled) return
        if (
          ref.current === event.target &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          onClick?.(
            event as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>,
          )
        }
        props.onKeyDown?.(event)
      }}
      className={clsx(props.className, {
        'is-clickable': !disabled,
      })}
      aria-disabled={disabled}
    />
  )
}
