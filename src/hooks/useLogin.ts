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

  // Login & Reset Password
  const [
    {
      isResettingTemporaryPassword,
      isLoggingIn,
      loginError,
      resetTemporaryPasswordCallback,
    },
    setLoginState,
  ] = React.useState<{
    isResettingTemporaryPassword: boolean
    isLoggingIn: boolean
    loginError: null | Error
    resetTemporaryPasswordCallback: null | ((newPassword: string) => void)
  }>({
    isResettingTemporaryPassword: false,
    isLoggingIn: false,
    loginError: null,
    resetTemporaryPasswordCallback: null,
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

    setLoginState({
      isResettingTemporaryPassword: false,
      resetTemporaryPasswordCallback: null,
      isLoggingIn: true,
      loginError: null,
    })

    try {
      const newResetPasswordCallback = await authService.loginUsernamePassword(
        username,
        password,
      )
      if (newResetPasswordCallback) {
        if (isMounted.current) {
          setLoginState({
            isResettingTemporaryPassword: false,
            isLoggingIn: false,
            resetTemporaryPasswordCallback: newResetPasswordCallback,
            loginError: null,
          })
        }
      }
    } catch (error) {
      Sentry.captureException(error)
      if (isMounted.current) {
        setLoginState({
          isResettingTemporaryPassword: false,
          isLoggingIn: false,
          resetTemporaryPasswordCallback: null,
          loginError: error,
        })
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
      await resetTemporaryPasswordCallback(newPassword)
    } catch (error) {
      Sentry.captureException(error)
      if (isMounted.current) {
        setLoginState((current) => ({
          ...current,
          isResettingPassword: false,
          loginError: error,
        }))
      }
    }
  }, [
    isMounted,
    newPassword,
    newPasswordConfirmedValidation.isInvalid,
    newPasswordValidation.isInvalid,
    resetTemporaryPasswordCallback,
  ])

  // Forgot Password
  const [
    isShowingForgotPassword,
    showForgotPassword,
    hideForgotPassword,
  ] = useBooleanState(false)
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
      const newResetForgottenPasswordCallback = await authService.forgotPassword(
        username,
      )
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
          forgotPasswordError: error,
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
          forgotPasswordError: error,
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
    isPasswordTemporary: !!resetTemporaryPasswordCallback,
    isResettingTemporaryPassword,
    resetTemporaryPassword,
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
