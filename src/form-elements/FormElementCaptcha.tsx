import * as React from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { FormTypes } from '@oneblink/types'

import useCaptcha from '../hooks/useCaptcha'
import useIsOffline from '../hooks/useIsOffline'
import useReCAPTCHAProps from '../hooks/useReCAPTCHAProps'
import { RECAPTCHA_OFFLINE_MESSAGE } from '../services/form-validation/validateSubmission'
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
  onChange: onCaptchaChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const { captchaSiteKey, captchaType, addCaptchaRef } = useCaptcha()
  const isOffline = useIsOffline()

  const captchaRef = React.useRef<ReCAPTCHA>(null)

  React.useEffect(() => {
    if (captchaRef.current) {
      // addCaptchaRef returns a function to remove the captcha which will fire when the component unmounts
      return addCaptchaRef(captchaRef.current)
    }
  }, [captchaRef, addCaptchaRef])

  const handleChange = React.useCallback(
    (val: string | null) => {
      onCaptchaChange(element, {
        value: val || undefined,
      })
    },
    [element, onCaptchaChange],
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
        {isOffline ? (
          <div role="alert" className="has-margin-top-8">
            <span className="has-text-danger">{RECAPTCHA_OFFLINE_MESSAGE}</span>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}

export default React.memo(FormElementCaptcha)
