import { FormTypes } from '@oneblink/types'
import * as React from 'react'

import OnLoading from './OnLoading'
import { FormElementConditionallyShownElement } from '../../types/form'

type Props = {
  options: FormTypes.ChoiceElementOption[] | undefined
  conditionallyShownOptionsElement:
    | FormElementConditionallyShownElement
    | undefined
  children: React.ReactNode
}

function FormElementOptions({
  options,
  children,
  conditionallyShownOptionsElement,
}: Props) {
  if (!options || conditionallyShownOptionsElement?.dependencyIsLoading) {
    return (
      <div>
        <OnLoading className="has-text-centered" small></OnLoading>
      </div>
    )
  }

  if (!options.length) {
    return (
      <div>
        <div className="has-text-grey is-size-7">
          We were unable to load your options. Please contact your
          administrator.
        </div>
      </div>
    )
  }

  return <div className="ob-form-element-options">{children}</div>
}

export default React.memo(FormElementOptions)
