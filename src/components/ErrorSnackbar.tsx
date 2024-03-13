import * as React from 'react'
import {
  Snackbar,
  IconButton,
  Alert as MuiAlert,
  AlertProps,
  styled,
} from '@mui/material'
import MaterialIcon from './MaterialIcon'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
  },
)

const StyledIcon = styled(MaterialIcon)(() => ({
  fontSize: 20,
}))

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
            <StyledIcon>close</StyledIcon>
          </IconButton>
        }
      >
        {children}
      </Alert>
    </Snackbar>
  )
}

export default React.memo(ErrorSnackbar)
