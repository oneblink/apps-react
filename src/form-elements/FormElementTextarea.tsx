import * as React from 'react'
import clsx from 'clsx'
import { FormTypes } from '@oneblink/types'
import { TextareaAutosize, styled } from '@mui/material'

import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'

const StyledTextareaAutosize = styled(TextareaAutosize)(() => ({
  resize: 'vertical',
}))

type Props = {
  id: string
  element: FormTypes.TextareaElement
  value: unknown
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  autocompleteAttributes?: string
} & IsDirtyProps

function FormElementTextarea({
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
  const text = typeof value === 'string' ? value : ''
  const isDisplayingCopyButton = !!element.readOnly && !!value
  const isDisplayingLookupButton =
    !!element.isDataLookup || !!element.isElementLookup

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp

  return (
    <div className="cypress-textarea-element">
      <FormElementLabelContainer
        className="ob-textarea"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="control">
          <StyledTextareaAutosize
            placeholder={element.placeholderValue}
            id={id}
            name={element.name}
            className="input ob-input cypress-textarea-control"
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
            minRows={4}
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
                lookupButtonConfig={element.lookupButton}
              />
            )}
          </div>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementTextarea)
