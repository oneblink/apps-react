import * as React from 'react'
import clsx from 'clsx'
import CopyToClipboardButton from '../components/CopyToClipboardButton'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/FormElementLabelContainer'

type Props = {
  id: string
  element: FormTypes.TextElement
  value: unknown
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: unknown | undefined,
  ) => unknown
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementText({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [isDirty, setIsDirty] = useBooleanState(false)

  const text = typeof value === 'string' ? value : ''
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage
  return (
    <div className="cypress-text-element">
      <FormElementLabelContainer className="ob-text" id={id} element={element}>
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
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementText)
