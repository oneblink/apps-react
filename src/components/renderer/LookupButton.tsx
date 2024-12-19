import * as React from 'react'
import clsx from 'clsx'
import useLookupNotification from '../../hooks/useLookupNotification'
import { generateLookupValidationMessage } from '../../services/form-validation/validators'
import useFormIsReadOnly from '../../hooks/useFormIsReadOnly'
import { EnvironmentTypes } from '@oneblink/types'
import MaterialIcon from '../MaterialIcon'

type Props = {
  value: unknown | undefined
  validationMessage: string | undefined
  hasMarginTop?: boolean
  isInputButton?: boolean
  lookupButtonConfig?: EnvironmentTypes.ButtonConfiguration
}

function LookupButton({
  value,
  validationMessage,
  hasMarginTop,
  isInputButton,
  lookupButtonConfig,
}: Props) {
  const { isLookup, onLookup, isDisabled, isLoading, allowLookupOnEmptyValue } =
    useLookupNotification(value)
  const formIsReadOnly = useFormIsReadOnly()
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
        formIsReadOnly ||
        isDisabled ||
        isLoading ||
        (isEmptyValue && !allowLookupOnEmptyValue) ||
        (!isEmptyValue &&
          !!validationMessage &&
          validationMessage !==
            generateLookupValidationMessage(lookupButtonConfig))
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
