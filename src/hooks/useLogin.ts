import * as React from 'react'
import { authService, Sentry } from '@oneblink/apps'

import useIsMounted from './useIsMounted'
import useBooleanState from './useBooleanState'

export default function useLogin({
  username,
  password,
  newPassword,
  newPasswordConfirmed,
  code,
}: {
  username: string
  password: string
  newPassword: string
  newPasswordConfirmed: string
  code: string
}) {
  const isMounted = useIsMounted()

  // Validation
  const usernameValidation = React.useMemo(() => {
    return {
      isInvalid: !username.trim(),
    }
  }, [username])

  const passwordValidation = React.useMemo(() => {
    return {
      isInvalid: !password.trim(),
    }
  }, [password])

  const codeValidation = React.useMemo(() => {
    return {
      isInvalid: !code.trim(),
    }
  }, [code])

  const newPasswordValidation = React.useMemo(() => {
    const validation = {
      hasLowercaseLetter: /[a-z]+/.test(newPassword),
      hasUpperCaseLetter: /[A-Z]+/.test(newPassword),
      hasNumber: /\d+/.test(newPassword),
      hasSpecialCharacter: /[\^$*.[\]{}()?|\-"!@#%&/,><':;|_~`]+/.test(
        newPassword,
      ),
      hasMinLength: newPassword.length >= 8,
      isInvalid: true,
    }
    validation.isInvalid =
      !validation.hasLowercaseLetter ||
      !validation.hasUpperCaseLetter ||
      !validation.hasNumber ||
      !validation.hasSpecialCharacter ||
      !validation.hasMinLength
    return validation
  }, [newPassword])

  const newPasswordConfirmedValidation = React.useMemo(() => {
    return {
      isInvalid: newPassword !== newPasswordConfirmed,
    }
  }, [newPassword, newPasswordConfirmed])

  // Login, Reset Password, MFA
  const [
    {
      isResettingTemporaryPassword,
      isLoggingIn,
      loginError,
      loginAttemptResponse,
      isSubmittingMfaCode,
    },
    setLoginState,
  ] = React.useState<{
    isResettingTemporaryPassword: boolean
    isLoggingIn: boolean
    loginError: null | Error
    loginAttemptResponse: authService.LoginAttemptResponse | undefined
    isSubmittingMfaCode: boolean
  }>({
    isResettingTemporaryPassword: false,
    isLoggingIn: false,
    loginError: null,
    loginAttemptResponse: undefined,
    isSubmittingMfaCode: false,
  })
  const clearLoginError = React.useCallback(
    () =>
      setLoginState((current) => ({
        ...current,
        loginError: null,
      })),
    [],
  )
  const loginWithUsernamePassword = React.useCallback(async () => {
    if (usernameValidation.isInvalid) {
      setLoginState((current) => ({
        ...current,
        loginError: new Error('Please enter a valid email address'),
      }))
      return
    }
    if (passwordValidation.isInvalid) {
      setLoginState((current) => ({
        ...current,
        loginError: new Error('Please enter a valid password'),
      }))
      return
    }

    setLoginState((currentState) => ({
      ...currentState,
      isLoggingIn: true,
      loginError: null,
    }))

    try {
      const newLoginAttemptResponse = await authService.loginUsernamePassword(
        username,
        password,
      )
      if (isMounted.current) {
        setLoginState((currentState) => ({
          ...currentState,
          isLoggingIn: false,
          loginAttemptResponse: newLoginAttemptResponse,
        }))
      }
    } catch (error) {
      Sentry.captureException(error)
      if (isMounted.current) {
        setLoginState((currentState) => ({
          ...currentState,
          isLoggingIn: false,
          loginError: error as Error,
        }))
      }
    }
  }, [
    isMounted,
    password,
    passwordValidation.isInvalid,
    username,
    usernameValidation.isInvalid,
  ])

  const resetTemporaryPassword = React.useCallback(async () => {
    const resetTemporaryPasswordCallback =
      loginAttemptResponse?.resetPasswordCallback
    if (!resetTemporaryPasswordCallback) {
      return
    }

    if (newPasswordValidation.isInvalid) {
      setLoginState((current) => ({
        ...current,
        loginError: new Error('Please enter a valid password'),
      }))
      return
    }

    if (newPasswordConfirmedValidation.isInvalid) {
      setLoginState((current) => ({
        ...current,
        loginError: new Error('Please confirm your new password'),
      }))
      return
    }

    setLoginState((current) => ({
      ...current,
      isResettingPassword: true,
      loginError: null,
    }))

    try {
      const resetPasswordResponse = await resetTemporaryPasswordCallback(
        newPassword,
      )
      if (isMounted.current) {
        setLoginState((currentState) => ({
          ...currentState,
          isResettingTemporaryPassword: false,
          loginAttemptResponse: resetPasswordResponse,
        }))
      }
    } catch (error) {
      Sentry.captureException(error)
      if (isMounted.current) {
        setLoginState((current) => ({
          ...current,
          isResettingPassword: false,
          loginError: error as Error,
        }))
      }
    }
  }, [
    isMounted,
    loginAttemptResponse?.resetPasswordCallback,
    newPassword,
    newPasswordConfirmedValidation.isInvalid,
    newPasswordValidation.isInvalid,
  ])

  const submitMfaCode = React.useCallback(async () => {
    const mfaCodeCallback = loginAttemptResponse?.mfaCodeCallback
    if (!mfaCodeCallback) {
      return
    }

    setLoginState((current) => ({
      ...current,
      isSubmittingMfaCode: true,
      loginError: null,
    }))

    try {
      const mfaResponse = await mfaCodeCallback(code)
      if (isMounted.current) {
        setLoginState((currentState) => ({
          ...currentState,
          isSubmittingMfaCode: false,
          loginAttemptResponse: mfaResponse,
        }))
      }
    } catch (error) {
      Sentry.captureException(error)
      if (isMounted.current) {
        setLoginState((current) => ({
          ...current,
          isSubmittingMfaCode: false,
          loginError: error as Error,
        }))
      }
    }
  }, [code, isMounted, loginAttemptResponse?.mfaCodeCallback])

  // Forgot Password
  const [isShowingForgotPassword, showForgotPassword, hideForgotPassword] =
    useBooleanState(false)
  const [
    {
      resetForgottenPasswordCallback,
      isSendingForgotPasswordCode,
      isResettingForgottenPassword,
      forgotPasswordError,
    },
    setForgotPasswordState,
  ] = React.useState<{
    isSendingForgotPasswordCode: boolean
    forgotPasswordError: null | Error
    resetForgottenPasswordCallback:
      | null
      | ((code: string, newPassword: string) => void)
    isResettingForgottenPassword: boolean
  }>({
    isSendingForgotPasswordCode: false,
    forgotPasswordError: null,
    resetForgottenPasswordCallback: null,
    isResettingForgottenPassword: false,
  })
  const clearForgotPasswordError = React.useCallback(
    () =>
      setForgotPasswordState((current) => ({
        ...current,
        forgotPasswordError: null,
      })),
    [],
  )
  const sendForgotPasswordCode = React.useCallback(async () => {
    if (usernameValidation.isInvalid) {
      setForgotPasswordState((current) => ({
        ...current,
        forgotPasswordError: new Error('Please enter a valid email address'),
      }))
      return
    }

    setForgotPasswordState({
      isSendingForgotPasswordCode: true,
      resetForgottenPasswordCallback: null,
      forgotPasswordError: null,
      isResettingForgottenPassword: false,
    })

    try {
      const newResetForgottenPasswordCallback =
        await authService.forgotPassword(username)
      if (isMounted.current) {
        setForgotPasswordState({
          isSendingForgotPasswordCode: false,
          resetForgottenPasswordCallback: newResetForgottenPasswordCallback,
          forgotPasswordError: null,
          isResettingForgottenPassword: false,
        })
      }
    } catch (error) {
      Sentry.captureException(error)
      if (isMounted.current) {
        setForgotPasswordState({
          isSendingForgotPasswordCode: false,
          resetForgottenPasswordCallback: null,
          forgotPasswordError: error as Error,
          isResettingForgottenPassword: false,
        })
      }
    }
  }, [isMounted, username, usernameValidation.isInvalid])

  const resetForgottenPassword = React.useCallback(async () => {
    if (!resetForgottenPasswordCallback) {
      return
    }

    if (codeValidation.isInvalid) {
      setForgotPasswordState((current) => ({
        ...current,
        forgotPasswordError: new Error(
          'Please enter the code that was sent to your email address',
        ),
      }))
    }
    if (newPasswordValidation.isInvalid) {
      setForgotPasswordState((current) => ({
        ...current,
        forgotPasswordError: new Error('Please enter a valid password'),
      }))
      return
    }
    if (newPasswordConfirmedValidation.isInvalid) {
      setForgotPasswordState((current) => ({
        ...current,
        forgotPasswordError: new Error('Please confirm your new password'),
      }))
      return
    }

    setForgotPasswordState((current) => ({
      ...current,
      isChangingPassword: true,
      forgotPasswordError: null,
    }))

    try {
      await resetForgottenPasswordCallback(code, newPassword)
      if (isMounted.current) {
        setForgotPasswordState({
          isSendingForgotPasswordCode: false,
          resetForgottenPasswordCallback: null,
          forgotPasswordError: null,
          isResettingForgottenPassword: false,
        })
        hideForgotPassword()
      }
    } catch (error) {
      Sentry.captureException(error)
      if (isMounted.current) {
        setForgotPasswordState((current) => ({
          ...current,
          isChangingPassword: false,
          forgotPasswordError: error as Error,
        }))
      }
    }
  }, [
    resetForgottenPasswordCallback,
    codeValidation.isInvalid,
    newPasswordValidation.isInvalid,
    newPasswordConfirmedValidation.isInvalid,
    code,
    newPassword,
    isMounted,
    hideForgotPassword,
  ])

  const loginWithGoogle = React.useCallback(() => {
    authService.loginHostedUI('Google')
  }, [])

  return {
    // Login
    loginWithGoogle,
    loginWithUsernamePassword,
    isLoggingIn,
    loginError,
    clearLoginError,
    // Reset Temp Password
    isPasswordTemporary: !!loginAttemptResponse?.resetPasswordCallback,
    isResettingTemporaryPassword,
    resetTemporaryPassword,
    // MFA Code
    isMfaCodeRequired: !!loginAttemptResponse?.mfaCodeCallback,
    isSubmittingMfaCode,
    submitMfaCode,
    // Showing Forgot Password
    isShowingForgotPassword,
    showForgotPassword,
    hideForgotPassword,
    forgotPasswordError,
    clearForgotPasswordError,
    // Sending Forgot Password Code
    isSendingForgotPasswordCode,
    sendForgotPasswordCode,
    // Resetting Forgotten Password
    hasSentForgotPasswordCode: !!resetForgottenPasswordCallback,
    isResettingForgottenPassword,
    resetForgottenPassword,
    // Validation
    usernameValidation,
    passwordValidation,
    codeValidation,
    newPasswordValidation,
    newPasswordConfirmedValidation,
  }
}
