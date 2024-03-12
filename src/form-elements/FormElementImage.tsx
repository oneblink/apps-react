import * as React from 'react'
import { FormTypes } from '@oneblink/types'

type Props = {
  element: FormTypes.ImageElement
}

function FormElementImage({ element }: Props) {
  return (
    <div className="ob-form__element ob-image cypress-image-element">
      <img
        className="ob-image__content cypress-image-element-content"
        src={element.defaultValue}
        alt={!element.decorativeImage ? element.label : ''}
      />
    </div>
  )
}

export default React.memo(FormElementImage)
