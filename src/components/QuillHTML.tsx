import * as React from 'react'
import clsx from 'clsx'
import sanitizeHtml from '../services/sanitize-html'

export default function QuillHTML({
  html,
  ...props
}: React.ComponentProps<'div'> & {
  html: string
}) {
  const [__html, includesLegacyLists] = React.useMemo(() => {
    const sanitizedHtml = sanitizeHtml(html)
    return [sanitizedHtml, sanitizedHtml.includes('ql-indent-')]
  }, [html])
  return (
    <div
      {...props}
      className={clsx(props.className, 'ob-quill-content', {
        'ob-quill-legacy-content': includesLegacyLists,
        // "content" is a bulma class: https://bulma.io/documentation/elements/content/
        content: !includesLegacyLists,
      })}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html,
      }}
    />
  )
}
