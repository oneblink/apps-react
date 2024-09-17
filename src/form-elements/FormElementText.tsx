import * as React from 'react'
import clsx from 'clsx'
import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'

type Props = {
  id: string
  element: FormTypes.TextElement
  value: unknown
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

function FormElementText({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const text = typeof value === 'string' ? value : ''

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp

  return (
    <div className="cypress-text-element">
      <FormElementLabelContainer
        className="ob-text"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              type="text"
              placeholder={element.placeholderValue}
              id={id}
              name={element.name}
              className="input ob-input cypress-text-control"
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
              autoComplete={element.autocompleteAttributes?.join(' ')}
            />
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
