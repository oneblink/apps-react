import * as React from 'react'
import MaterialIcon from '../../MaterialIcon'
export default function Work(
  props: Omit<React.ComponentProps<typeof MaterialIcon>, 'children'>,
) {
  return <MaterialIcon {...props}>work</MaterialIcon>
}
