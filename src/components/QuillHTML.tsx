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
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  )
}
