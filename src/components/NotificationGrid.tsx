import * as React from 'react'
import { Grid } from '@mui/material'

export function NotificationGrid({
  className,
  gridClassName,
  children,
}: React.PropsWithChildren<{
  gridClassName: string
  className: string
}>) {
  return (
    <div className={`notification ${className}`}>
      <Grid container spacing={1} className={gridClassName}>
        {children}
      </Grid>
    </div>
  )
}

export function NotificationGridItem({
  label,
  value,
  fullWidth,
  className,
  labelClassName,
  valueClassName,
}: {
  label: string
  value: string | undefined
  fullWidth?: boolean
  className: string
  labelClassName: string
  valueClassName: string
}) {
  if (!value) {
    return null
  }

  return (
    <Grid
      item
      className={className}
      sx={(theme) => ({
        flexBasis: '100%',
        flexGrow: 0,
        maxWidth: '100%',

        ...(fullWidth
          ? {}
          : {
              [theme.breakpoints.up('sm').replace('@media', '@container')]: {
                flexBasis: '50%',
                maxWidth: '50%',
              },
              [theme.breakpoints.up('lg').replace('@media', '@container')]: {
                flexBasis: '33.33%',
                maxWidth: '33.33%',
              },
            }),
      })}
    >
      <label className={`is-size-6 has-text-weight-semibold ${labelClassName}`}>
        {label}
      </label>
      <div className={valueClassName}>{value}</div>
    </Grid>
  )
}
