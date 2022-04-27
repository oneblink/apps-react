import * as React from 'react'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material'

type ListItemsProps = {
  children: React.ReactNode
  disablePadding?: boolean
}

type ListProps = {
  children: React.ReactNode
  spaced?: boolean
}

function li(props: React.ComponentProps<typeof Typography>) {
  return (
    <Typography {...props} component="li" color="inherit" variant="body2" />
  )
}

export const OrderedList = styled('ol', {
  shouldForwardProp: (prop) => prop !== 'disablePadding',
})<ListItemsProps>(({ theme, disablePadding }) => {
  return {
    margin: 0,
    padding: theme.spacing(1, 1, 1, 4),
    '& > ul, & > ol': {
      'padding-top': 0,
      'padding-bottom': 0,
    },
    ...(disablePadding
      ? {
          'padding-top': 0,
          'padding-bottom': 0,
        }
      : {}),
  }
})
export const UnorderedList = styled('ul', {
  shouldForwardProp: (prop) => prop !== 'disablePadding',
})<ListItemsProps>(({ theme, disablePadding }) => {
  return {
    margin: 0,
    padding: theme.spacing(1, 1, 1, 4),
    '& > ul, & > ol': {
      'padding-top': 0,
      'padding-bottom': 0,
    },
    ...(disablePadding
      ? {
          'padding-top': 0,
          'padding-bottom': 0,
        }
      : {}),
  }
})
export const ListItem = styled(li, {
  shouldForwardProp: (prop) => prop !== 'spaced',
})<ListProps>(({ theme, spaced }) => {
  return {
    margin: 0,
    padding: theme.spacing(1, 1, 1, 4),
    '& > ul, & > ol': {
      'padding-top': 0,
      'padding-bottom': 0,
    },
    ...(spaced
      ? {
          lineHeight: 1.9,
        }
      : {}),
  }
})
