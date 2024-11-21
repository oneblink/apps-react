import * as React from 'react'
import { Box, IconButton, Icon } from '@mui/material'
interface Props {
  onClear: () => void
  select?: boolean
  value: unknown
}

const InputClear = ({ onClear, select, value }: Props) => {
  if (!value || (Array.isArray(value) && !value.length)) return null
  return (
    <Box mr={select ? 2 : 0} alignItems="center" display="flex">
      <IconButton size="small" onClick={onClear}>
        <Icon>close</Icon>
      </IconButton>
    </Box>
  )
}

export default React.memo<Props>(InputClear)
