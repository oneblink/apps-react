import * as React from 'react'
import clsx from 'clsx'

export function Clickable(
  props: React.ComponentProps<'div'> & {
    disabled?: boolean
  },
) {
  const ref = React.useRef<HTMLDivElement>(null)
  return (
    <div
      {...props}
      role="button"
      tabIndex={props.disabled ? -1 : 0}
      ref={ref}
      onKeyDown={(event) => {
        if (
          ref.current === event.target &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          props.onClick?.(
            event as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>,
          )
        }
        props.onKeyDown?.(event)
      }}
      className={clsx(props.className, {
        'is-clickable': !props.disabled,
      })}
      aria-disabled={props.disabled}
    />
  )
}
