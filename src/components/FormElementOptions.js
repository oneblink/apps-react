// @flow
'use strict'

import * as React from 'react'

import { OnLoading } from 'components'

type Props = {
  options: ChoiceElementOption[] | void,
  children: React.Node,
}

function FormElementOptions({ options, children }: Props) {
  if (!options) {
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

  return <div>{children}</div>
}

export default React.memo<Props>(FormElementOptions)
