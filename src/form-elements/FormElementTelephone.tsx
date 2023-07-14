import * as React from 'react'

import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'

type Props = {
  id: string
  element: FormTypes.TelephoneElement
  value: unknown
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

function FormElementTelephone({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
}: Props) {
  const text = typeof value === 'string' ? value : ''
  return (
    <div className="cypress-telephone-element">
      <FormElementLabelContainer
        className="ob-telephone"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="field has-addons">
          <div className="control is-expanded has-icons-right">
            <input
              type="tel"
              placeholder={element.placeholderValue}
              id={id}
              name={element.name}
              className="input ob-input cypress-telephone-control"
              value={text}
              onChange={(e) => onChange(element, e.target.value || undefined)}
              required={element.required}
              disabled={element.readOnly}
              onBlur={setIsDirty}
            />
            <span className="ob-input-icon icon is-small is-right">
              <i className="material-icons is-size-5">phone</i>
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
            allowLookupOnEmptyValue={element.runLookupOnClear}
          />
        </div>

        {(isDirty || displayValidationMessage) && !!validationMessage && (
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

export default React.memo(FormElementTelephone)
