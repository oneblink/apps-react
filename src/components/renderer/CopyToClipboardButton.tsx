import { Tooltip } from '@mui/material'
import * as React from 'react'

import utilsService from '../../services/utils-service'

type Props = {
  text: string
  className?: string
}

function CopyToClipboardButton({ className, text }: Props) {
  const copy = React.useCallback(() => {
    utilsService.copyToClipboard(text)
  }, [text])
  return (
    <Tooltip title="Copy to clipboard">
      <button onClick={copy} className={className} type="button">
        <span className="icon">
          <i className="material-icons">file_copy</i>
        </span>
      </button>
    </Tooltip>
  )
}

export default React.memo(CopyToClipboardButton)
