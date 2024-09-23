import * as React from 'react'
import {
  Typography,
  Grid,
  Container,
  useTheme,
  styled,
  Icon,
} from '@mui/material'
import { CommonProps } from '@mui/material/OverridableComponent'
import { Color } from '../../types/mui-color'

type IconProps = React.ComponentProps<typeof Icon>

export type Props = {
  IconComponent: React.ComponentType<{
    color: IconProps['color']
    style: IconProps['style']
  }>
  title: string
  variant: Color
  gutterTop?: boolean
  gutterBottom?: boolean
  children?: React.ReactNode
  action?: React.ReactNode
  className?: CommonProps['className']
  role?: string
}

function LargeIconMessage({
  IconComponent,
  title,
  variant,
  gutterTop,
  gutterBottom,
  children,
  action,
  className,
  role,
}: Props) {
  const theme = useTheme()

  const fontSize = React.useMemo(() => theme.spacing(16), [theme])

  return (
    <Container
      maxWidth="sm"
      className={className || 'ob-large-icon-message'}
      role={role}
    >
      <StyledIconContainer gutterTop={gutterTop}>
        <IconComponent color={variant} style={{ fontSize }} />
      </StyledIconContainer>
      <Typography
        variant="h5"
        align="center"
        gutterBottom
        color={`${variant}.main`}
      >
        {title}
      </Typography>
      {children ? (
        <StyledTypography
          align="center"
          variant="body2"
          paragraph={!!action}
          gutterBottom={!action && gutterBottom}
        >
          {children}
        </StyledTypography>
      ) : null}
      {action && (
        <StyledGrid
          container
          justifyContent="center"
          gutterBottom={gutterBottom}
        >
          {action}
        </StyledGrid>
      )}
    </Container>
  )
}

export default React.memo<Props>(LargeIconMessage)

const StyledIconContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'gutterTop',
})<{
  gutterTop?: boolean
}>(({ theme, gutterTop }) => ({
  textAlign: 'center',
  ...(gutterTop
    ? {
        paddingTop: theme.spacing(4),
      }
    : {}),
}))

const StyledTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'gutterBottom',
})<React.ComponentProps<typeof Typography>>(({ theme, gutterBottom }) => ({
  ...(gutterBottom ? { marginBottom: theme.spacing(4) } : {}),
}))

const StyledGrid = styled(Grid, {
  shouldForwardProp: (prop) => prop !== 'gutterBottom',
})<{ gutterBottom?: boolean }>(({ theme, gutterBottom }) => ({
  ...(gutterBottom ? { marginBottom: theme.spacing(4) } : {}),
}))
