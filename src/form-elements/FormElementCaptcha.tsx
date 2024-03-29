import * as React from 'react'
import ReCAPTCHA from 'react-google-recaptcha'

import useCaptchaSiteKey from '../hooks/useCaptchaSiteKey'
import { FormTypes } from '@oneblink/types'
import { FormElementValueChangeHandler } from '../types/form'

type Props = {
  element: FormTypes.CaptchaElement
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  value: string | undefined
}

function FormElementCaptcha({
  element,
  onChange,
  validationMessage,
  displayValidationMessage,
  value,
}: Props) {
  const captchaSiteKey = useCaptchaSiteKey()
  const ref = React.useRef<ReCAPTCHA | null>(null)

  React.useEffect(() => {
    if (ref.current) {
      const refValue = ref.current.getValue()
      if (refValue && !value) {
        ref.current.reset()
      }
    }
  }, [value])

  return (
    <div className="cypress-captcha-element">
      <div className="ob-form__element ob-captcha">
        <ReCAPTCHA
          sitekey={captchaSiteKey || ''}
          onChange={(val) => {
            onChange(element, {
              value: val || undefined,
            })
          }}
          className="ob-input cypress-captcha-control"
          ref={ref}
        />

        {displayValidationMessage && !!validationMessage && (
          <div role="alert" className="has-margin-top-8">
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
