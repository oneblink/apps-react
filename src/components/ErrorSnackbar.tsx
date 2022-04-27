import * as React from 'react'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert, { AlertProps } from '@mui/material/Alert'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

function ErrorSnackbar({
  open,
  onClose,
  children,
}: {
  open: boolean
  children: React.ReactNode
  onClose: (arg: null) => unknown
}) {
  const handleClose = React.useCallback(
    (e: unknown, reason?: string) => {
      if (reason !== 'clickaway') {
        onClose(null)
      }
    },
    [onClose],
  )
  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      open={open}
      onClose={handleClose}
    >
      <Alert onClose={handleClose} severity="error">
        {children}
      </Alert>
    </Snackbar>
  )
}

export default React.memo(ErrorSnackbar)
