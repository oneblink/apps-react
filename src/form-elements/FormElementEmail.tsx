import * as React from 'react'

import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import MaterialIcon from '../components/MaterialIcon'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

type Props = {
  id: string
  element: FormTypes.EmailElement
  value: unknown
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  autocompleteAttributes?: string
} & IsDirtyProps

function FormElementEmail({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
  autocompleteAttributes,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp

  const text = typeof value === 'string' ? value : ''
  return (
    <div className="cypress-email-element">
      <FormElementLabelContainer
        className="ob-email"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="field has-addons">
          <div className="control is-expanded has-icons-right">
            <input
              type="email"
              placeholder={element.placeholderValue}
              id={id}
              name={element.name}
              className="input ob-input cypress-email-control"
              value={text}
              onChange={(e) =>
                onChange(element, {
                  value: e.target.value || undefined,
                })
              }
              required={element.required}
              disabled={element.readOnly}
              onBlur={setIsDirty}
              aria-describedby={ariaDescribedby}
              autoComplete={autocompleteAttributes}
              aria-required={element.required}
            />
            <span className="ob-input-icon icon is-small is-right">
              <MaterialIcon className="is-size-5">email</MaterialIcon>
            </span>
          </div>
          {!!element.readOnly && !!value && (
            <div className="control">
              <CopyToClipboardButton
                className="button is-input-addon copy-button cypress-copy-to-clipboard-button"
                text={text}
              />
            </div>
          )}
          <LookupButton
            isInputButton
            value={value}
            validationMessage={validationMessage}
            lookupButtonConfig={element.lookupButton}
          />
        </div>

        {isDisplayingValidationMessage && (
          <FormElementValidationMessage>
            {validationMessage}
          </FormElementValidationMessage>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementEmail)
