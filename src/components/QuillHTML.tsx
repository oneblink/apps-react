import * as React from 'react'
import clsx from 'clsx'
import sanitizeHtml from '../services/sanitize-html'

export default function QuillHTML({
  html,
  ...props
}: React.ComponentProps<'div'> & {
  html: string
}) {
  const __html = React.useMemo(() => sanitizeHtml(html), [html])
  return (
    <div
      {...props}
      className={clsx(props.className, 'ob-quill-content')}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html,
      }}
    />
  )
}
