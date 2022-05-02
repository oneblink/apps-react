import * as React from 'react'
import { Snackbar, IconButton } from '@mui/material'
import { Close } from '@mui/icons-material'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import { styled } from '@mui/material/styles'

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
      className="ob-error-snackbar"
    >
      <Alert
        severity="error"
        action={
          <IconButton
            key="close"
            aria-label="Close"
            color="inherit"
            onClick={handleClose}
            data-cypress="error-snackbar-close"
            size="large"
          >
            <StyledCloseIcon />
          </IconButton>
        }
      >
        {children}
      </Alert>
    </Snackbar>
  )
}

const StyledCloseIcon = styled(Close)(() => ({
  fontSize: 20,
}))

export default React.memo(ErrorSnackbar)
