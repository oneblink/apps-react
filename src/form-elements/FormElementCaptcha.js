// @flow
'use strict'

import * as React from 'react'
import ReCAPTCHA from 'react-google-recaptcha'

/* ::
type Props = {
  element: CaptchaElement,
  onChange: (FormElement, string | void) => void,
  displayValidationMessage: boolean,
  validationMessage: string | void,
}
*/

const __RECAPTCHA_SITE_KEY__ = ''

function FormElementCaptcha(
  {
    element,
    onChange,
    validationMessage,
    displayValidationMessage,
  } /* : Props */,
) {
  return (
    <div className="cypress-captcha-element">
      <div className="ob-form__element ob-captcha">
        <ReCAPTCHA
          sitekey={__RECAPTCHA_SITE_KEY__}
          onChange={(val) => {
            if (val === null) val = undefined
            onChange(element, val)
          }}
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

export default (React.memo(
  FormElementCaptcha,
) /*: React.AbstractComponent<Props> */)
