import * as React from 'react'
import clsx from 'clsx'

import CopyToClipboardButton from '../components/CopyToClipboardButton'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/FormElementLabelContainer'

type Props = {
  id: string
  element: FormTypes.EmailElement
  value: unknown
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: string | undefined,
  ) => unknown
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementEmail({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [isDirty, setIsDirty] = useBooleanState(false)

  const text = typeof value === 'string' ? value : ''
  return (
    <div className="cypress-email-element">
      <FormElementLabelContainer className="ob-email" id={id} element={element}>
        <label
          className={clsx('label ob-label', {
            'is-required': element.required,
          })}
          htmlFor={id}
        >
          {element.label}
        </label>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              type="email"
              placeholder={element.placeholderValue}
              id={id}
              name={element.name}
              className="input ob-input cypress-email-control"
              value={text}
              onChange={(e) => onChange(element, e.target.value || undefined)}
              required={element.required}
              disabled={element.readOnly}
              onBlur={setIsDirty}
            />
          </div>
          {!!element.readOnly && !!value && (
            <div className="control">
              <CopyToClipboardButton
                className="button is-input-addon cypress-copy-to-clipboard-button"
                isInputButton
                text={text}
              />
            </div>
          )}
          <LookupButton
            isInputButton
            value={value}
            validationMessage={validationMessage}
          />
        </div>

        {(isDirty || displayValidationMessage) && !!validationMessage && (
          <div role="alert">
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
