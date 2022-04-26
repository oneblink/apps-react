import * as React from 'react'
import clsx from 'clsx'
import { Theme } from '@mui/material/styles'
import withStyles from '@mui/styles/withStyles'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import SnackbarContent from '@mui/material/SnackbarContent'
import ErrorIcon from '@mui/icons-material/Error'
import CloseIcon from '@mui/icons-material/Close'

const styles = (theme: Theme) => ({
  snackbarContent: {
    backgroundColor: theme.palette.error.dark,
  },
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    marginRight: theme.spacing(2),
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
})

type Props = {
  open: boolean
  children: React.ReactNode
  onClose: (arg: null) => unknown
}

class ErrorSnackbar extends React.Component<
  Props & {
    classes: Record<string, string>
  }
> {
  handleClose = (e: unknown, reason: string) => {
    if (reason !== 'clickaway') {
      this.props.onClose(null)
    }
  }

  render() {
    const { classes, open, children } = this.props
    return (
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        open={open}
        onClose={this.handleClose}
      >
        <SnackbarContent
          className={classes.snackbarContent}
          message={
            <span className={classes.message}>
              <ErrorIcon className={clsx(classes.icon, classes.iconVariant)} />
              {children}
            </span>
          }
          action={[
            // @ts-expect-error ???
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              className={classes.close}
              onClick={this.handleClose}
              data-cypress="error-snackbar-close"
              size="large"
            >
              <CloseIcon className={classes.icon} />
            </IconButton>,
          ]}
        />
      </Snackbar>
    )
  }
}

export default withStyles(styles)(ErrorSnackbar) as React.ComponentType<Props>
