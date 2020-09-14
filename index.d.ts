import * as React from 'react'
import { FormTypes } from '@oneblink/apps'
import { MiscTypes } from '@oneblink/types'
import { FormElementsCtrl } from './typescript/types/form'
interface OneBlinkFormProps {
  form: FormTypes.Form
  isPreview?: boolean
  initialSubmission?: FormElementsCtrl['model'] | null
  googleMapsApiKey?: string
  captchaSiteKey?: string
  onCancel: () => unknown
  onSubmit: (formSubmission: FormTypes.NewFormSubmission) => unknown
  onSaveDraft?: (draftSubmission: FormTypes.NewDraftSubmission) => unknown
  onChange?: (model: FormElementsCtrl['model']) => unknown
}
declare const OneBlinkForm: React.FunctionComponent<OneBlinkFormProps>

type OneBlinkAutoSaveFormProps = OneBlinkFormProps & {
  autoSaveKey?: string
}
declare const OneBlinkAutoSaveForm: React.FunctionComponent<OneBlinkAutoSaveFormProps>

declare const useBooleanState: (
  defaultValue: boolean,
) => [boolean, () => void, () => void, () => void]

declare const useNullableState: <T>(
  defaultValue: T | null,
) => [T | null, (value: T) => void, () => void]

declare const useClickOutsideElement: (
  ref: { current: HTMLElement },
  callback: () => void,
) => void

declare const useIsMounted: () => { current: boolean }

declare const IsOfflineContextProvider: React.FunctionComponent<{
  children: React.ReactNode
}>

declare const useIsOffline: () => boolean

declare const useLogin: (options: {
  username: string
  password: string
  newPassword: string
  newPasswordConfirmed: string
  code: string
}) => {
  loginWithGoogle: () => void
  loginWithUsernamePassword: () => void
  isLoggingIn: boolean
  loginError: Error | null
  clearLoginError: () => void
  isPasswordTemporary: boolean
  isResettingTemporaryPassword: boolean
  resetTemporaryPassword: () => void
  isShowingForgotPassword: boolean
  showForgotPassword: () => void
  hideForgotPassword: () => void
  forgotPasswordError: Error | null
  clearForgotPasswordError: () => void
  isSendingForgotPasswordCode: boolean
  sendForgotPasswordCode: () => void
  hasSentForgotPasswordCode: boolean
  isResettingForgottenPassword: boolean
  resetForgottenPassword: () => void
  usernameValidation: { isInvalid: boolean }
  passwordValidation: { isInvalid: boolean }
  codeValidation: { isInvalid: boolean }
  newPasswordValidation: {
    isInvalid: boolean
    hasLowercaseLetter: boolean
    hasUpperCaseLetter: boolean
    hasNumber: boolean
    hasSpecialCharacter: boolean
    hasMinLength: boolean
  }
  newPasswordConfirmedValidation: { isInvalid: boolean }
}

declare const useAuth: () => {
  isLoggedIn: boolean
  userProfile: MiscTypes.UserProfile | null
  userFriendlyName: string | null
  isUsingFormsKey: boolean
}

interface AuthContextProviderProps {
  children: React.ReactNode
  formsKeyToken?: string
}
declare const AuthContextProvider: React.FunctionComponent<AuthContextProviderProps>

export {
  OneBlinkForm,
  OneBlinkAutoSaveForm,
  useBooleanState,
  useNullableState,
  useClickOutsideElement,
  IsOfflineContextProvider,
  useIsOffline,
  useIsMounted,
  useLogin,
  useAuth,
  AuthContextProvider,
}
