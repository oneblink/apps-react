import { useMemo, RefObject } from 'react'
import ReCAPTCHA, { ReCAPTCHAProps } from 'react-google-recaptcha'
import { CaptchaType } from '../typedoc'

export default function useReCAPTCHAProps({
  captchaSiteKey,
  captchaRef,
  captchaType,
  onCaptchaChange,
}: {
  captchaSiteKey: string | undefined
  captchaRef: RefObject<ReCAPTCHA | null>
  captchaType: CaptchaType | undefined
  onCaptchaChange: (token: string | null) => void
}) {
  const recaptchaProps: ReCAPTCHAProps = useMemo(() => {
    const baseProps = {
      sitekey: captchaSiteKey || '',
      className: 'ob-input cypress-captcha-control',
      ref: captchaRef,
    }
    switch (captchaType) {
      case 'INVISIBLE':
        return {
          ...baseProps,
          size: 'invisible',
          badge: 'inline',
        }
      case 'CHECKBOX':
      default: {
        return {
          ...baseProps,
          onChange: onCaptchaChange,
        }
      }
    }
  }, [captchaSiteKey, captchaType, captchaRef, onCaptchaChange])

  return recaptchaProps
}
