import * as React from 'react'
import { styled } from '@mui/material'
import MaterialIcon from './MaterialIcon'
import { Color } from '../types/mui-color'

const StyledErrorIcon = styled(
  ({
    icon,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    color,
    ...props
  }: { icon: string; color?: Color } & React.ComponentProps<
    typeof MaterialIcon
  >) => <MaterialIcon {...props}>{icon}</MaterialIcon>,
  {
    shouldForwardProp: () => true,
  },
)(({ theme, color }) => ({
  color: color ? theme.palette[color].main : undefined,
}))

export default function IconComponent({
  icon,
  color,
  ...props
}: { color: Color; icon: string } & React.ComponentProps<typeof MaterialIcon>) {
  return <StyledErrorIcon color={color} {...props} icon={icon} />
}
