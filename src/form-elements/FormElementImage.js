// @flow
'use strict'

import * as React from 'react'

/* ::
type Props = {
  element: ImageElement,
}
*/

function FormElementImage({ element } /* : Props */) {
  return (
    <div className="ob-form__element ob-image cypress-image-element">
      <img
        className="ob-image__content cypress-image-element-content"
        src={element.defaultValue}
        alt={element.label}
      />
    </div>
  )
}

export default (React.memo(
  FormElementImage,
) /*: React.AbstractComponent<Props> */)
