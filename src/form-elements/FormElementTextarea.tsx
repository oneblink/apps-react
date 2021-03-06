import * as React from 'react'
import clsx from 'clsx'
import CopyToClipboardButton from '../components/CopyToClipboardButton'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import { FormElementValueChangeHandler } from '../types/form'

type Props = {
  id: string
  element: FormTypes.TextareaElement
  value: unknown
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
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
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage
  return (
    <div className="cypress-textarea-element">
      <FormElementLabelContainer
        className="ob-textarea"
        id={id}
        element={element}
        required={element.required}
      >
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

        {(isDisplayingValidationMessage || !!element.maxLength) && (
          <div role="alert" className="has-margin-top-8">
            <div className="is-flex is-justify-content-space-between">
              {isDisplayingValidationMessage ? (
                <div className="has-text-danger ob-error__text cypress-validation-message">
                  {validationMessage}
                </div>
              ) : (
                <div />
              )}
              {!!element.maxLength && (
                <div
                  className={clsx(
                    'ob-max-length__text cypress-max-length-message',
                    {
                      'has-text-danger': text.length > element.maxLength,
                    },
                  )}
                >
                  {text.length} / {element.maxLength}
                </div>
              )}
            </div>
          </div>
        )}

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
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementTextarea)
