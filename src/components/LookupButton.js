// @flow
'use strict'

import * as React from 'react'
import clsx from 'clsx'
import useLookupNotification from 'form/hooks/useLookupNotification'
import { lookupValidationMessage } from 'form/services/form-validation'

type Props = {
  value: mixed | void,
  validationMessage: string | void,
  hasMarginTop?: boolean,
  isInputButton?: boolean,
}

function LookupButton({
  value,
  validationMessage,
  hasMarginTop,
  isInputButton,
}: Props) {
  const { isLookup, onLookup, isDisabled } = useLookupNotification()

  if (!isLookup) {
    return null
  }

  const button = (
    <button
      type="button"
      className={clsx(
        'button is-primary ob-lookup__button cypress-lookup-button',
        {
          'is-input-addon': isInputButton,
          'ob-button': !isInputButton,
          'has-margin-top-8': hasMarginTop,
        },
      )}
      onClick={onLookup}
      disabled={
        isDisabled ||
        value === undefined ||
        (validationMessage && validationMessage !== lookupValidationMessage)
      }
    >
      {isInputButton && <span></span>}
      <span className="icon">
        <i className="material-icons">search</i>
      </span>
      <span className={isInputButton ? 'is-hidden-mobile' : undefined}>
        &nbsp;Lookup
      </span>
    </button>
  )

  if (isInputButton) {
    return <div className="control">{button}</div>
  }

  return button
}

export default React.memo<Props>(LookupButton)
