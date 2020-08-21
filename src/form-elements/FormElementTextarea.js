// @flow
'use strict'

import * as React from 'react'
import clsx from 'clsx'
import { CopyToClipboardButton } from 'components'
import useBooleanState from 'form/hooks/useBooleanState'
import LookupButton from 'form/components/LookupButton'

type Props = {
  id: string,
  element: TextareaElement,
  value: mixed,
  onChange: (FormElement, string) => mixed,
  displayValidationMessage: boolean,
  validationMessage: string | void,
}

function FormElementTextarea({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [isDirty, setIsDirty] = useBooleanState(false)

  const text = typeof value === 'string' ? value : ''
  const isDisplayingCopyButton = !!element.readOnly && !!value
  const isDisplayingLookupButton =
    !!element.isDataLookup || !!element.isElementLookup
  return (
    <div className="cypress-textarea-element">
      <div className="ob-form__element ob-textarea">
        <label
          className={clsx('label ob-label', {
            'is-required': element.required,
          })}
          htmlFor={id}
        >
          {element.label}
        </label>
        <div className="control">
          <textarea
            placeholder={element.placeholderValue}
            id={id}
            name={element.name}
            className="textarea input ob-input cypress-textarea-control"
            value={text}
            onChange={(e) => onChange(element, e.target.value || undefined)}
            required={element.required}
            disabled={element.readOnly}
            onBlur={setIsDirty}
          />
        </div>

        {(isDisplayingLookupButton || isDisplayingCopyButton) && (
          <div className="buttons ob-buttons has-margin-top-8">
            {isDisplayingCopyButton && (
              <CopyToClipboardButton
                className="button ob-button cypress-copy-to-clipboard-button"
                text={text}
              />
            )}
            {isDisplayingLookupButton && (
              <LookupButton
                value={value}
                validationMessage={validationMessage}
              />
            )}
          </div>
        )}

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

export default React.memo<Props>(FormElementTextarea)
