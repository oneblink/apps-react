import * as React from 'react'
import copy from 'copy-to-clipboard'
import { IconButton, Tooltip, Snackbar } from '@mui/material'
import FileCopy from '@mui/icons-material/FileCopy'

type Props = {
  text: string
  large?: boolean
  noMarginY?: boolean
} & React.ComponentProps<typeof IconButton>

export function CopyToClipBoardIconButton({
  text,
  large,
  noMarginY,
  className,
  ...rest
}: Props) {
  const noMarginYProp = {
    marginTop: -1,
    marginBottom: -1,
  }
  const [isCopyToClipboardOpen, setIsCopyToClipboardOpen] =
    React.useState(false)
  const copyToClipboard = React.useCallback(() => {
    copy(text)
    setIsCopyToClipboardOpen(true)
  }, [text])
  const handleClose = React.useCallback(() => {
    setIsCopyToClipboardOpen(false)
  }, [])
  return (
    <>
      <Tooltip title="Copy to clipboard">
        <IconButton
          onClick={(e) => {
            e.stopPropagation()
            copyToClipboard()
          }}
          data-cypress="copy-to-clip-board-button"
          className={className}
          sx={noMarginY ? noMarginYProp : undefined}
          {...rest}
        >
          <FileCopy sx={large ? undefined : { fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        open={isCopyToClipboardOpen}
        onClose={handleClose}
        autoHideDuration={1500}
        ContentProps={{
          'aria-describedby': 'copy-clip-board-message-id',
        }}
        message={
          <span
            id="copy-clip-board-message-id"
            data-cypress="copied-text-to-clip-board-message"
          >
            Copied to Clipboard
          </span>
        }
      />
    </>
  )
}
export default React.memo(CopyToClipBoardIconButton)
