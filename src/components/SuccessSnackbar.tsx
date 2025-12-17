import * as React from 'react'
import { Grid, Icon, Snackbar, SnackbarContent } from '@mui/material'

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
      <SnackbarContent
        sx={{ bgcolor: 'success.main' }}
        message={
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 'auto' }}>
              <Icon>check_circle</Icon>
            </Grid>
            <Grid size={{ xs: 'grow' }}>{children}</Grid>
          </Grid>
        }
      />
    </Snackbar>
  )
}

export default React.memo(SuccessSnackbar)
