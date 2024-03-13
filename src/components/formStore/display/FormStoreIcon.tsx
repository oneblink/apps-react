import * as React from 'react'
import IconComponent from '../../IconComponent'
export default function Work({
  ...props
}: Omit<React.ComponentProps<typeof IconComponent>, 'icon'>) {
  return <IconComponent {...props} icon="work" />
}
