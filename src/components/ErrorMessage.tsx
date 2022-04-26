import * as React from 'react'
import ErrorIcon from '@mui/icons-material/Error'
import LargeIconMessage from './messages/LargeIconMessage'
import { Button } from '@mui/material'
type Props = {
  IconComponent?: React.ComponentType<{
    className: string
  }>
  title: string
  gutterTop?: boolean
  gutterBottom?: boolean
  children?: React.ReactNode
  onTryAgain?: () => void
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
            >
              Try Again
            </Button>
          )
        }
      >
        {children}
      </LargeIconMessage>
    </>
  )
}

export default React.memo<Props>(ErrorMessage)
