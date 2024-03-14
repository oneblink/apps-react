import * as React from 'react'
import LargeIconMessage, {
  Props as LargeIconMessageProps,
} from './LargeIconMessage'
import { Button } from '@mui/material'
import MaterialIcon from '../MaterialIcon'
type Props = {
  IconComponent?: LargeIconMessageProps['IconComponent']
  title: string
  gutterTop?: boolean
  gutterBottom?: boolean
  children?: React.ReactNode
  onTryAgain?: () => void
}

const ErrorIcon: LargeIconMessageProps['IconComponent'] = (
  props: React.ComponentProps<typeof MaterialIcon>,
) => <MaterialIcon {...props}>error</MaterialIcon>

function ErrorMessage({
  title,
  children,
  gutterTop,
  gutterBottom,
  IconComponent,
  onTryAgain,
}: Props) {
  return (
    <>
      <LargeIconMessage
        IconComponent={IconComponent || ErrorIcon}
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
