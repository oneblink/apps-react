import React, { memo } from 'react'
import QuillHTML from './QuillHTML'
import useReplaceableText from '../hooks/useReplaceableText'

function OneBlinkFormFooter({ footer }: { footer: string }) {
  const html = useReplaceableText(footer)

  return (
    <footer className="ob-footer-container">
      <QuillHTML html={html} />
    </footer>
  )
}

export default memo(OneBlinkFormFooter)
