import * as React from 'react'
// import ErrorIcon from '@mui/icons-material/Error'
import LargeIconMessage, {
  Props as LargeIconMessageProps,
} from './LargeIconMessage'
import { Button, styled } from '@mui/material'
import MaterialIcon from '../MaterialIcon'
import { Color } from '../../types/mui-color'
type Props = {
  IconComponent?: LargeIconMessageProps['IconComponent']
  title: string
  gutterTop?: boolean
  gutterBottom?: boolean
  children?: React.ReactNode
  onTryAgain?: () => void
}

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

function StyledIconComponent({
  color,
  ...props
}: { color: Color } & React.ComponentProps<typeof MaterialIcon>) {
  return <StyledErrorIcon color={color} {...props} icon="error" />
}

function ErrorMessage({
  title,
  children,
  gutterTop,
  gutterBottom,
  IconComponent,
  onTryAgain,
}: Props) {
  if (!IconComponent) {
    IconComponent = StyledIconComponent
  }

  return (
    <>
      <LargeIconMessage
        IconComponent={IconComponent}
        title={title}
        variant="error"
        gutterTop={gutterTop}
        gutterBottom={gutterBottom}
        action={
          onTryAgain && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => onTryAgain()}
              data-cypress="error-try-again-button"
            >
              Try Again
            </Button>
          )
        }
        className="ob-error-snackbar"
      >
        {children}
      </LargeIconMessage>
    </>
  )
}

export default React.memo<Props>(ErrorMessage)
