import * as React from 'react'
import sanitizeHtml from 'sanitize-html'

export default function useSanitizedHTML(text: string) {
  return React.useMemo(() => sanitizeHtml(text), [text])
}
