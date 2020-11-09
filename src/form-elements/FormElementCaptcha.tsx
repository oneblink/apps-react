import * as React from 'react'
import ReCAPTCHA from 'react-google-recaptcha'

import useCaptchaSiteKey from '../hooks/useCaptchaSiteKey'
import { FormTypes } from '@oneblink/types'

type Props = {
  element: FormTypes.CaptchaElement
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: string | undefined,
  ) => void
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementCaptcha({
  element,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const captchaSiteKey = useCaptchaSiteKey()

  return (
    <div className="cypress-captcha-element">
      <div className="ob-form__element ob-captcha">
        <ReCAPTCHA
          sitekey={captchaSiteKey || ''}
          onChange={(val) => {
            onChange(element, val || undefined)
          }}
          // @ts-expect-error
          className="ob-input cypress-captcha-control"
        />

        {displayValidationMessage && !!validationMessage && (
          <div role="alert">
            <div className="has-text-danger ob-error__text cypress-required cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(FormElementCaptcha)
