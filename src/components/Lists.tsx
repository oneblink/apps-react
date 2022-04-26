import * as React from 'react'
import clsx from 'clsx'
import { Theme } from '@mui/material/styles'
import withStyles from '@mui/styles/withStyles'
import Typography from '@mui/material/Typography'

interface WithStylesProps {
  classes: Record<string, string>
}

const styles = (theme: Theme) => ({
  list: {
    margin: 0,
    padding: theme.spacing(1, 1, 1, 4),
    '& > ul, & > ol': {
      'padding-top': 0,
      'padding-bottom': 0,
    },
  },
  noPadding: {
    'padding-top': 0,
    'padding-bottom': 0,
  },
  listItem: {
    display: 'list-item',
  },
  spacedLineHeight: {
    lineHeight: 1.9,
  },
})

type Props = {
  children: React.ReactNode
  disablePadding?: boolean
  spaced?: boolean
}

function ol({
  classes,
  disablePadding,
  children,
  ...props
}: Props & WithStylesProps) {
  return (
    <ol
      className={clsx(classes.list, {
        [classes.noPadding]: disablePadding,
      })}
      {...props}
    >
      {children}
    </ol>
  )
}

function ul({
  classes,
  disablePadding,
  children,
  ...props
}: Props & WithStylesProps) {
  return (
    <ul
      className={clsx(classes.list, {
        [classes.noPadding]: disablePadding,
      })}
      {...props}
    >
      {children}
    </ul>
  )
}

function li({ classes, children, spaced, ...props }: Props & WithStylesProps) {
  return (
    <Typography
      component="li"
      color="inherit"
      variant="body2"
      className={clsx(classes.listItem, {
        [classes.spacedLineHeight]: spaced,
      })}
      {...props}
    >
      {children}
    </Typography>
  )
}

export const OrderedList = withStyles(styles)(ol) as React.ComponentType<Props>
export const UnorderedList = withStyles(styles)(
  ul,
) as React.ComponentType<Props>
export const ListItem = withStyles(styles)(li) as React.ComponentType<Props>
