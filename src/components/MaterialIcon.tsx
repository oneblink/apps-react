import * as React from 'react'
import { Icon } from '@mui/material'

export default function MaterialIcon(props: React.ComponentProps<typeof Icon>) {
  return <Icon aria-hidden {...props} />
}
