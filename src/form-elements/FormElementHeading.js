// @flow
'use strict'

import * as React from 'react'

/* ::
type Props = {
  element: HeadingElement,
}
*/

function FormElementHeading({ element } /* : Props */) {
  return (
    <div className="cypress-heading-element">
      <div className="ob-form__element ob-heading">
        <Heading headingType={element.headingType}>{element.label}</Heading>
      </div>
    </div>
  )
}

export default (React.memo(
  FormElementHeading,
) /*: React.AbstractComponent<Props> */)

const Heading = React.memo(function Heading(
  {
    headingType,
    children,
  } /* : {
  headingType: number,
  children: React.Node,
} */,
) {
  const className = `ob-heading__text title is-${headingType}`
  switch (headingType) {
    case 1:
      return <h1 className={className}>{children}</h1>
    case 2:
      return <h2 className={className}>{children}</h2>
    case 3:
      return <h3 className={className}>{children}</h3>
    case 4:
      return <h4 className={className}>{children}</h4>
    case 5:
    default:
      return <h5 className={className}>{children}</h5>
  }
})
