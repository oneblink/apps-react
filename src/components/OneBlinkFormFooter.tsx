import React, { memo } from 'react'
import QuillHTML from './QuillHTML'
import useReplaceableText from '../hooks/useReplaceableText'

function OneBlinkFormFooter({ footer }: { footer: string }) {
  const html = useReplaceableText(footer)

  return <QuillHTML html={html} className="ob-footer-container" />
}

export default memo(OneBlinkFormFooter)
