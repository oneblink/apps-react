import * as React from 'react'
import Typography from '@mui/material/Typography'
import { styled, Theme } from '@mui/material'

type ListItemsProps = {
  children: React.ReactNode
  disablePadding?: boolean
}

const noPaddingY = {
  'padding-top': 0,
  'padding-bottom': 0,
}

const getListStyles = (theme: Theme) => ({
  margin: 0,
  padding: theme.spacing(1, 1, 1, 4),
  '& > ul, & > ol': noPaddingY,
})

export const OrderedList = styled('ol', {
  shouldForwardProp: (prop) => prop !== 'disablePadding',
})<ListItemsProps>(({ theme, disablePadding }) => {
  return {
    ...getListStyles(theme),
    ...(disablePadding ? noPaddingY : {}),
  }
})
export const UnorderedList = styled('ul', {
  shouldForwardProp: (prop) => prop !== 'disablePadding',
})<ListItemsProps>(({ theme, disablePadding }) => {
  return {
    ...getListStyles(theme),
    ...(disablePadding ? noPaddingY : {}),
  }
})

type ListProps = {
  spaced?: boolean
}

function Li(props: Omit<React.ComponentProps<typeof Typography>, 'ref'>) {
  return (
    <Typography {...props} component="li" color="inherit" variant="body2" />
  )
}

export const ListItem = styled(Li, {
  shouldForwardProp: (prop) => prop !== 'spaced',
})<ListProps>(({ theme, spaced }) => {
  return {
    display: 'list-item',
    ...(spaced
      ? {
          lineHeight: 1.9,
        }
      : {}),
  }
})
