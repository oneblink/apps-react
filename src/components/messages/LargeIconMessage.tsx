import * as React from 'react'
import clsx from 'clsx'
import makeStyles from '@mui/styles/makeStyles'
import { Typography, Grid, Container } from '@mui/material'
// import { styled } from '@mui/material/styles'

type Props = {
  IconComponent: React.ComponentType<{
    className: string
  }>
  title: string
  variant: 'primary' | 'success' | 'error' | 'warning'
  gutterTop?: boolean
  gutterBottom?: boolean
  children?: React.ReactNode
  action?: React.ReactNode
}
// Styles
const useStyles = makeStyles((theme) => ({
  gutterTop: {
    paddingTop: theme.spacing(4),
  },
  gutterBottom: {
    marginBottom: theme.spacing(4),
  },
  iconContainer: {
    textAlign: 'center',
  },
  icon: {
    fontSize: theme.spacing(16),
  },
  primaryText: {
    color: theme.palette.primary.main,
  },
  successText: {
    color: theme.palette.success.main,
  },
  errorText: {
    color: theme.palette.error.main,
  },
  warningText: {
    color: theme.palette.warning.main,
  },
}))

// TODO: Come back to this
// interface StyledIconContainerProps {
//   gutterTop?: boolean
// }

// const StyledIconContainer = styled('div', {
//   shouldForwardProp: (prop) => prop !== 'gutterTop',
// })<StyledIconContainerProps>(({ theme, gutterTop }) => ({
//   textAlign: 'center',
//   ...(gutterTop
//     ? {
//         paddingTop: theme.spacing(4),
//       }
//     : {}),
// }))

function LargeIconMessage({
  IconComponent,
  title,
  variant,
  gutterTop,
  gutterBottom,
  children,
  action,
}: Props) {
  const classes = useStyles()
  const textClassName = clsx({
    [classes.primaryText]: variant === 'primary',
    [classes.successText]: variant === 'success',
    [classes.errorText]: variant === 'error',
    [classes.warningText]: variant === 'warning',
  })
  return (
    <Container maxWidth="sm">
      <div
        className={clsx(classes.iconContainer, {
          [classes.gutterTop]: gutterTop,
        })}
      >
        <IconComponent className={clsx(classes.icon, textClassName)} />
      </div>
      <Typography
        variant="h5"
        align="center"
        gutterBottom
        className={textClassName}
      >
        {title}
      </Typography>
      {children ? (
        <Typography
          align="center"
          variant="body2"
          paragraph={!!action}
          className={clsx({
            [classes.gutterBottom]: !action && gutterBottom,
          })}
        >
          {children}
        </Typography>
      ) : null}
      {action && (
        <Grid
          container
          justifyContent="center"
          className={clsx({
            [classes.gutterBottom]: gutterBottom,
          })}
        >
          {action}
        </Grid>
      )}
    </Container>
  )
}

export default React.memo<Props>(LargeIconMessage)
