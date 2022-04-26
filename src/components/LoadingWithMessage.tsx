import * as React from 'react'
import { Box, CircularProgress, Grid, Typography } from '@mui/material'
type Props = {
  message?: string
}

const Loading = ({ message }: Props) => {
  return (
    <Box p={2}>
      <Grid container spacing={2}>
        <Grid xs={12} container item justifyContent="center">
          <CircularProgress></CircularProgress>
        </Grid>
        {message && (
          <Grid xs={12} container item justifyContent="center">
            <Typography variant="body2" align="center">
              {message}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default React.memo<Props>(Loading)
