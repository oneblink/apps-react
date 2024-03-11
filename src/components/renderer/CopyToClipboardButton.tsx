import { Tooltip } from '@mui/material'
import * as React from 'react'

import utilsService from '../../services/utils-service'
import MaterialIcon from '../MaterialIcon'

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
          <MaterialIcon>file_copy</MaterialIcon>
        </span>
      </button>
    </Tooltip>
  )
}

export default React.memo(CopyToClipboardButton)
