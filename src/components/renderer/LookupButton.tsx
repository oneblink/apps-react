import * as React from 'react'
import clsx from 'clsx'
import useLookupNotification from '../../hooks/useLookupNotification'
import { generateLookupValidationMessage } from '../../services/form-validation/validators'
import { EnvironmentTypes } from '@oneblink/types'
import MaterialIcon from '../MaterialIcon'

type Props = {
  value: unknown | undefined
  validationMessage: string | undefined
  hasMarginTop?: boolean
  isInputButton?: boolean
  lookupButtonConfig?: EnvironmentTypes.ButtonConfiguration
  overrideRequiredMessage: string | undefined
}

function LookupButton({
  value,
  validationMessage,
  hasMarginTop,
  isInputButton,
  lookupButtonConfig,
  overrideRequiredMessage,
}: Props) {
  const {
    isLookup,
    onLookup,
    isLookupRequestInFlight,
    isLoading,
    allowLookupOnEmptyValue,
    areLookupsDisallowed,
  } = useLookupNotification(value)
  if (!isLookup) {
    return null
  }

  const isEmptyValue = value === undefined || value === null

  const button = (
    <button
      type="button"
      className={clsx(
        'button is-primary ob-lookup__button cypress-lookup-button',
        {
          'is-loading': isLoading,
          'is-input-addon': isInputButton,
          'ob-button': !isInputButton,
          'has-margin-top-8': hasMarginTop,
        },
      )}
      onClick={() => onLookup()}
      disabled={
        // Deliberately not the element's own `readOnly` flag: a locked field
        // populated by a previous lookup still needs its button to run the
        // next lookup in the chain.
        areLookupsDisallowed ||
        isLookupRequestInFlight ||
        isLoading ||
        (isEmptyValue && !allowLookupOnEmptyValue) ||
        (!isEmptyValue &&
          !!validationMessage &&
          validationMessage !==
            generateLookupValidationMessage(
              lookupButtonConfig,
              overrideRequiredMessage,
            ))
      }
    >
      {isInputButton && <span></span>}
      <span className="icon">
        <MaterialIcon>{lookupButtonConfig?.icon ?? 'search'}</MaterialIcon>
      </span>
      <span className={isInputButton ? 'is-hidden-mobile' : undefined}>
        &nbsp;{lookupButtonConfig?.label ?? 'Lookup'}
      </span>
    </button>
  )

  if (isInputButton) {
    return <div className="control">{button}</div>
  }

  return button
}

export default React.memo(LookupButton)
