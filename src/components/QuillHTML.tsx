import * as React from 'react'
import clsx from 'clsx'

export default function QuillHTML({
  html,
  ...props
}: React.ComponentProps<'div'> & {
  html: string
}) {
  return (
    <div
      {...props}
      className={clsx(props.className, 'ql-editor')}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  )
}
