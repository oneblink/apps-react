import * as React from 'react'
import LargeIconMessage from './LargeIconMessage'
type Props = {
  IconComponent: React.ComponentType<{
    className: string
  }>
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
    >
      {children}
    </LargeIconMessage>
  )
}
export default React.memo<Props>(NoResourcesYet)
