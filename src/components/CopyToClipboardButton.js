// @flow
'use strict'

import * as React from 'react'

import utilsService from 'services/utils-service'

type Props = {
  text: string,
  className?: string,
  isInputButton?: boolean,
}

function CopyToClipboardButton({ className, text, isInputButton }: Props) {
  const copy = React.useCallback(() => {
    utilsService.copyToClipboard(text)
  }, [text])
  return (
    <button onClick={copy} className={className} type="button">
      <span></span>
      <span className="icon">
        <i className="material-icons">file_copy</i>
      </span>
      {!!isInputButton && <span className="is-hidden-mobile">&nbsp;Copy</span>}
    </button>
  )
}

export default React.memo<Props>(CopyToClipboardButton)
