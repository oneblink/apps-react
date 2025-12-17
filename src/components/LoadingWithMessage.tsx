import * as React from 'react'
import { Box, CircularProgress, Grid, Typography } from '@mui/material'
type Props = {
  message?: string
}

const Loading = ({ message }: Props) => {
  return (
    <Box p={2} className="ob-loading-with-message">
      <Grid container spacing={2} className="ob-loading">
        <Grid size={{ xs: 12 }} container justifyContent="center">
          <CircularProgress></CircularProgress>
        </Grid>
        {message && (
          <Grid
            size={{ xs: 12 }}
            container
            justifyContent="center"
            className="ob-loading-message"
          >
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
