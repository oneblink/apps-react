import * as React from 'react'
// import ErrorIcon from '@mui/icons-material/Error'
import LargeIconMessage, {
  Props as LargeIconMessageProps,
} from './LargeIconMessage'
import { Button } from '@mui/material'
import IconComponent from '../IconComponent'
type Props = {
  IconComponent?: LargeIconMessageProps['IconComponent']
  title: string
  gutterTop?: boolean
  gutterBottom?: boolean
  children?: React.ReactNode
  onTryAgain?: () => void
}

const ErrorIcon = (
  props: Omit<React.ComponentProps<typeof IconComponent>, 'icon'>,
) => <IconComponent {...props} icon="error" />

function ErrorMessage({
  title,
  children,
  gutterTop,
  gutterBottom,
  IconComponent,
  onTryAgain,
}: Props) {
  if (!IconComponent) {
    IconComponent = ErrorIcon
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
