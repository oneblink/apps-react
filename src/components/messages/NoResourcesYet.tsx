import * as React from 'react'
import LargeIconMessage, {
  Props as LargeIconMessageProps,
} from './LargeIconMessage'
type Props = {
  IconComponent: LargeIconMessageProps['IconComponent']
  title: string
  gutterBottom?: boolean
  children?: React.ReactNode
}
export function NoResourcesYet({
  title,
  children,
  IconComponent,
  gutterBottom,
}: Props) {
  return (
    <LargeIconMessage
      IconComponent={IconComponent}
      title={title}
      variant="primary"
      gutterBottom={gutterBottom}
      gutterTop
      className="ob-no-resources-yet-message"
    >
      {children}
    </LargeIconMessage>
  )
}
export default React.memo<Props>(NoResourcesYet)
