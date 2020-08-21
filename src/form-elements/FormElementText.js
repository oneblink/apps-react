// @flow
'use strict'

import * as React from 'react'
import clsx from 'clsx'
import CopyToClipboardButton from '../components/CopyToClipboardButton'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/LookupButton'

/* ::
type Props = {
  id: string,
  element: TextElement,
  value: mixed,
  onChange: (FormElement, string) => mixed,
  displayValidationMessage: boolean,
  validationMessage: string | void,
}
*/

function FormElementText(
  {
    id,
    element,
    value,
    onChange,
    validationMessage,
    displayValidationMessage,
  } /* : Props */,
) {
  const [isDirty, setIsDirty] = useBooleanState(false)

  const text = typeof value === 'string' ? value : ''
  return (
    <div className="cypress-text-element">
      <div className="ob-form__element ob-text">
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
              type="text"
              placeholder={element.placeholderValue}
              id={id}
              name={element.name}
              className="input ob-input cypress-text-control"
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
      </div>
    </div>
  )
}

export default (React.memo(
  FormElementText,
) /*: React.AbstractComponent<Props> */)
