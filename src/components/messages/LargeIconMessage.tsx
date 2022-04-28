import * as React from 'react'
import { Typography, Grid, Container } from '@mui/material'
import { styled } from '@mui/material/styles'

type Variant = 'primary' | 'success' | 'error' | 'warning'
export type Props = {
  IconComponent: React.ComponentType<{ color: Variant }>
  title: string
  variant: Variant
  gutterTop?: boolean
  gutterBottom?: boolean
  children?: React.ReactNode
  action?: React.ReactNode
}

function LargeIconMessage({
  IconComponent,
  title,
  variant,
  gutterTop,
  gutterBottom,
  children,
  action,
}: Props) {
  const Icon = React.useMemo(() => {
    return styled(IconComponent)(({ theme }) => ({
      fontSize: theme.spacing(16),
    }))
  }, [IconComponent])

  return (
    <Container maxWidth="sm">
      <StyledIconContainer gutterTop={gutterTop}>
        <Icon color={variant} />
      </StyledIconContainer>
      <Typography variant="h5" align="center" gutterBottom color={variant}>
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
