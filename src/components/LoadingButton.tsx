import * as React from 'react'
import { CircularProgress, Button } from '@mui/material'

type Props = {
  loading: boolean
} & React.ComponentProps<typeof Button>
const LoadingButton = ({ loading, color, disabled, ...props }: Props) => {
  return (
    <Button color={color} disabled={loading || disabled} {...props}>
      <>
        <span style={{ opacity: loading ? 0 : undefined }}>
          {props.children}
        </span>
        {loading && (
          <CircularProgress
            color={color}
            style={{
              position: 'absolute',
            }}
            size={24}
          ></CircularProgress>
        )}
      </>
    </Button>
  )
}
export default React.memo(LoadingButton)
