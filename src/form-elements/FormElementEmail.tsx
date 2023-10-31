import * as React from 'react'

import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'

type Props = {
  id: string
  element: FormTypes.EmailElement
  value: unknown
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
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
}: Props) {
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
            />
            <span className="ob-input-icon icon is-small is-right">
              <i className="material-icons is-size-5">email</i>
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
          <div role="alert" className="has-margin-top-8">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementEmail)
