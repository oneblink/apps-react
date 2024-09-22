import { useContext, createContext, RefObject } from 'react'
import { ReCAPTCHA } from 'react-google-recaptcha'
import { CaptchaType } from '../types/form'

export const CaptchaContext = createContext<{
  captchaSiteKey: string | undefined
  captchaType: CaptchaType
  captchaRefs: Array<RefObject<ReCAPTCHA>>
  addCaptchaRef: (ref: RefObject<ReCAPTCHA>) => void
}>({
  captchaSiteKey: undefined,
  captchaType: 'CHECKBOXES',
  captchaRefs: [],
  addCaptchaRef: () => {},
})

export default function useCaptcha() {
  return useContext(CaptchaContext)
}
