import { styled } from '@mui/material'

export const CropContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'height',
})<{ height?: number }>(({ height, theme }) => ({
  position: 'relative',
  width: '100%',
  display: 'flex',
  backdropFilter: 'brightness(0.5)',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius,
  ...(height ? { height } : { flex: 1 }),
}))
