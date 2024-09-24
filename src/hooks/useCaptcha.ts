import { useContext, createContext } from 'react'
import { ReCAPTCHA } from 'react-google-recaptcha'
import { CaptchaType } from '../types/form'

export const CaptchaContext = createContext<{
  captchaSiteKey: string | undefined
  captchaType: CaptchaType
  addCaptchaRef: (captcha: ReCAPTCHA) => () => void
}>({
  captchaSiteKey: undefined,
  captchaType: 'CHECKBOX',
  addCaptchaRef: () => () => {},
})

export default function useCaptcha() {
  return useContext(CaptchaContext)
}
