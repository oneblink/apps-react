import * as React from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { FormTypes } from '@oneblink/types'

import useCaptcha from '../hooks/useCaptcha'
import useReCAPTCHAProps from '../hooks/useReCAPTCHAProps'
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
  onChange: onCaptchChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const { captchaSiteKey, captchaType, addCaptchaRef } = useCaptcha()

  const captchaRef = React.useRef<ReCAPTCHA>(null)

  React.useEffect(() => {
    if (captchaRef) {
      addCaptchaRef(captchaRef)
    }
  }, [captchaRef, addCaptchaRef])

  const handleChange = React.useCallback(
    (val: string | null) => {
      onCaptchChange(element, {
        value: val || undefined,
      })
    },
    [element, onCaptchChange],
  )

  const recaptchaProps = useReCAPTCHAProps({
    captchaSiteKey,
    captchaRef,
    captchaType,
    onCaptchaChange: handleChange,
  })

  return (
    <div className="cypress-captcha-element">
      <div className="ob-form__element ob-captcha">
        <ReCAPTCHA
          {...recaptchaProps}
          className="ob-input cypress-captcha-control"
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
