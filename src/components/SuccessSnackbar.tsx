import * as React from 'react'
import { Alert, Grid, Icon, Snackbar } from '@mui/material'

function SuccessSnackbar({
  open,
  onClose,
  children,
}: {
  open: boolean
  children: React.ReactNode
  onClose: (isOpen: false) => void
}) {
  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      open={open}
      onClose={(event, reason) => {
        if (reason === 'clickaway') {
          return
        }
        onClose(false)
      }}
      autoHideDuration={3000}
    >
      <Alert severity="success">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs="auto">
            <Icon>check_circle</Icon>
          </Grid>
          <Grid item xs>
            {children}
          </Grid>
        </Grid>
      </Alert>
    </Snackbar>
  )
}

export default React.memo(SuccessSnackbar)
