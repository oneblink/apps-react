import * as React from 'react'
import { styled } from '@mui/material'
import MaterialIcon from './MaterialIcon'
import { Color } from '../types/mui-color'

const StyledMaterialIcon = styled(({ icon, ...props }: { icon: string }) => (
  <MaterialIcon {...props}>{icon}</MaterialIcon>
))<{ color: Color; icon: string }>(({ theme, color }) => ({
  color: theme.palette[color]?.main,
}))

export default function IconComponent({
  icon,
  color,
  ...props
}: { color: Color; icon: string } & React.ComponentProps<typeof MaterialIcon>) {
  return <StyledMaterialIcon color={color} icon={icon} {...props} />
}
