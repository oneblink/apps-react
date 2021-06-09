import * as React from 'react'

import OneBlinkFormBase, {
  Props,
  OptionalHandlerProps,
} from './OneBlinkFormBase'

function OneBlinkForm(props: Props & Required<OptionalHandlerProps>) {
  return <OneBlinkFormBase isReadOnly={false} {...props} />
}

export default React.memo(OneBlinkForm)
