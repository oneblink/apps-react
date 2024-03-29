import * as React from 'react'
import copy from 'copy-to-clipboard'
import { IconButton, Tooltip, Snackbar, SxProps, Portal } from '@mui/material'
import MaterialIcon from './MaterialIcon'

type Props = {
  text: string
  large?: boolean
  noMarginY?: boolean
} & React.ComponentProps<typeof IconButton>

const noMargin: SxProps = {
  marginTop: -1,
  marginBottom: -1,
}
export function CopyToClipBoardIconButton({
  text,
  large,
  noMarginY,
  className,
  ...rest
}: Props) {
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
          sx={noMarginY ? noMargin : undefined}
          {...rest}
        >
          <MaterialIcon style={large ? undefined : { fontSize: 18 }}>
            file_copy
          </MaterialIcon>
        </IconButton>
      </Tooltip>
      <Portal>
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
      </Portal>
    </>
  )
}

export default React.memo(CopyToClipBoardIconButton)
