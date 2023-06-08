import * as React from 'react'
import { authService, Sentry } from '@oneblink/apps'

import useIsMounted from './useIsMounted'
import useBooleanState from './useBooleanState'

/**
 * This function is a react hook to help writing your own login screen.
 *
 * ## Example
 *
 * ```jsx
 * import * as React from 'react'
 * import { useHistory } from 'react-router-dom'
 * import { useLogin } from '@oneblink/apps-react'
 *
 * function App() {
 *   const history = useHistory()
 *
 *   const [username, setUsername] = React.useState('')
 *   const [password, setPassword] = React.useState('')
 *   const [newPasswordConfirmed, setNewPasswordConfirmed] = React.useState('')
 *   const [newPassword, setNewPassword] = React.useState('')
 *   const [code, setCode] = React.useState('')
 *
 *   const onLogin = React.useCallback(() => {
 *     history.push('/')
 *   }, [history])
 *
 *   const {
 *     // Login
 *     loginWithGoogle,
 *     loginWithUsernamePassword,
 *     isLoggingIn,
 *     // Reset Temp Password
 *     isPasswordTemporary,
 *     isResettingTemporaryPassword,
 *     resetTemporaryPassword,
 *     // MFA Password
 *     isMfaCodeRequired,
 *     isSubmittingMfaCode,
 *     submitMfaCode,
 *     // Login Errors
 *     loginError,
 *     clearLoginError,
 *     // Showing Forgot Password
 *     isShowingForgotPassword,
 *     showForgotPassword,
 *     hideForgotPassword,
 *     // Sending Forgot Password Code
 *     isSendingForgotPasswordCode,
 *     sendForgotPasswordCode,
 *     // Resetting Forgotten Password
 *     hasSentForgotPasswordCode,
 *     isResettingForgottenPassword,
 *     resetForgottenPassword,
 *     // Forgot Password Errors
 *     forgotPasswordError,
 *     clearForgotPasswordError,
 *     // Validation
 *     usernameValidation,
 *     passwordValidation,
 *     codeValidation,
 *     newPasswordValidation,
 *     newPasswordConfirmedValidation,
 *   } = useLogin({
 *     username,
 *     password,
 *     newPassword,
 *     newPasswordConfirmed,
 *     code,
 *     onLogin,
 *   })
 *
 *   if (hasSentForgotPasswordCode) {
 *     return (
 *       <form
 *         onSubmit={(e) => {
 *           e.preventDefault()
 *           resetForgottenPassword()
 *         }}
 *       >
 *         <p>We have sent you a password reset code via email. Enter it below to reset your password.</p>
 *
 *         <input
 *           type="password"
 *           placeholder="Code"
 *           value={code}
 *           onChange={(e) => setCode(e.target.value)}
 *         />
 *
 *         <input
 *           type="password"
 *           placeholder="New Password"
 *           value={newPassword}
 *           onChange={(e) => setNewPassword(e.target.value)}
 *         />
 *
 *         <input
 *           type="password"
 *           placeholder="Confirm Password"
 *           value={newPassword}
 *           onChange={(e) => setNewPasswordConfirmed(e.target.value)}
 *         />
 *
 *         <button
 *           type="submit"
 *           disabled={isResettingForgottenPassword || codeValidation.isInvalid || newPasswordValidation.isInvalid || newPasswordConfirmedValidation.isInvalid}
 *         >
 *           Change Password
 *         </button>
 *
 *         <p>Password Requirements</p>
 *         <p>Contains a lowercase letter: {validation.hasLowercaseLetter ? 'Yes' : 'No'}</p>
 *         <p>Contains an upper case letter: {validation.hasUpperCaseLetter ? 'Yes' : 'No'}</p>
 *         <p>Contains a number: {validation.hasNumber ? 'Yes' : 'No'}</p>
 *         <p>Contains a special character: {validation.hasSpecialCharacter ? 'Yes' : 'No'}</p>
 *         <p>Contains at least 8 characters: {validation.hasMinLength ? 'Yes' : 'No'}</p>
 *
 *         {forgotPasswordError && (
 *           <p>{forgotPasswordError.message}</p>
 *           <button type="button" onClick={clearForgotPasswordError}>Clear Error</button>
 *         )}
 *       </form>
 *     )
 *   }
 *
 *   if (isShowingForgotPassword) {
 *     return (
 *       <form
 *         onSubmit={(e) => {
 *           e.preventDefault()
 *           sendForgotPasswordCode()
 *         }}
 *       >
 *         <p>Enter your email address and we will send you a code to reset your password.</p>
 *
 *         <input
 *           type="email"
 *           placeholder="Email Address"
 *           value={username}
 *           onChange={(e) => setUsername(e.target.value)}
 *         />
 *
 *         <p>
 *           <a onClick={hideForgotPassword}>Remembered your password?</a>
 *         </p>
 *
 *         <button
 *           type="submit"
 *           disabled={isSendingForgotPasswordCode || usernameValidation.isInvalid}
 *         >
 *           Reset Password
 *         </button>
 *
 *         {forgotPasswordError && (
 *           <p>{forgotPasswordError.message}</p>
 *           <button type="button" onClick={clearForgotPasswordError}>Clear Error</button>
 *         )}
 *       </form>
 *     )
 *   }
 *
 *   if (isPasswordTemporary) {
 *     return (
 *       <form
 *         onSubmit={(e) => {
 *           e.preventDefault()
 *           resetTemporaryPassword()
 *         }}
 *       >
 *         <p>The password you entered was only temporary and must be reset for security purposes. Please enter your new password below to continue.</p>
 *
 *         <input
 *           type="password"
 *           placeholder="New Password"
 *           value={newPassword}
 *           onChange={(e) => setNewPassword(e.target.value)}
 *         />
 *
 *         <input
 *           type="password"
 *           placeholder="Confirm Password"
 *           value={newPassword}
 *           onChange={(e) => setNewPasswordConfirmed(e.target.value)}
 *         />
 *
 *         <button
 *           type="submit"
 *           disabled={isResettingTemporaryPassword || newPasswordValidation.isInvalid || newPasswordConfirmedValidation.isInvalid}
 *         >
 *           Change Password &amp; Sign In
 *         </button>
 *
 *         <p>Password Requirements</p>
 *         <p>Contains a lowercase letter: {validation.hasLowercaseLetter ? 'Yes' : 'No'}</p>
 *         <p>Contains an upper case letter: {validation.hasUpperCaseLetter ? 'Yes' : 'No'}</p>
 *         <p>Contains a number: {validation.hasNumber ? 'Yes' : 'No'}</p>
 *         <p>Contains a special character: {validation.hasSpecialCharacter ? 'Yes' : 'No'}</p>
 *         <p>Contains at least 8 characters: {validation.hasMinLength ? 'Yes' : 'No'}</p>
 *
 *         {loginError && (
 *           <p>{loginError.message}</p>
 *           <button type="button" onClick={clearLoginError}>Clear Error</button>
 *         )}
 *       </form>
 *     )
 *   }
 *
 *   if (isMfaCodeRequired) {
 *     return (
 *       <form
 *         onSubmit={(e) => {
 *           e.preventDefault()
 *           submitMfaCode()
 *         }}
 *       >
 *         <p>Enter the 6-digit code found in your authenticator app.</p>
 *
 *         <input
 *           type="password"
 *           placeholder="Code"
 *           value={code}
 *           onChange={(e) => setCode(e.target.value)}
 *         />
 *
 *         <button
 *           type="submit"
 *           disabled={isSubmittingMfaCode || codeValidation.isInvalid}
 *         >
 *           Sign In
 *         </button>
 *
 *         {loginError && (
 *           <p>{loginError.message}</p>
 *           <button type="button" onClick={clearLoginError}>Clear Error</button>
 *         )}
 *       </form>
 *     )
 *   }
 *
 *   return (
 *     <form
 *       onSubmit={(e) => {
 *         e.preventDefault()
 *         loginWithUsernamePassword()
 *       }}
 *     >
 *       <p>Sign in with your email address and password.</p>
 *       <input
 *         type="email"
 *         placeholder="Email Address"
 *         value={username}
 *         onChange={(e) => setUsername(e.target.value)}
 *       />
 *
 *       <input
 *         type="password"
 *         placeholder="New Password"
 *         value={newPassword}
 *         onChange={(e) => setNewPassword(e.target.value)}
 *       />
 *
 *       <p>
 *         <a onClick={showForgotPassword}>Forgot your password?</a>
 *       </p>
 *
 *       <button
 *         type="submit"
 *         disabled={isLoggingIn || usernameValidation.isInvalid || passwordValidation.isInvalid}
 *       >
 *         {children}
 *       </button>
 *
 *       <p>or</p>
 *
 *       <button
 *         type="button"
 *         onClick={loginWithGoogle}
 *       >
 *         <img
 *           alt="Google"
 *           src="google-sign-in.png"
 *         />
 *         <span>Sign in with Google</span>
 *       </button>
 *
 *       {loginError && (
 *         <p>{loginError.message}</p>
 *         <button type="button" onClick={clearLoginError}>Clear Error</button>
 *       )}
 *     </form>
 *   )
 * }
 *
 * const root = document.getElementById('root')
 * if (root) {
 *   ReactDOM.render(<App />, root)
 * }
 * ```
 *
 * @param options
 * @returns
 */
export default function useLogin({
  username,
  password,
  newPassword,
  newPasswordConfirmed,
  code,
}: {
  /** The email address entered by the user. */
  username: string
  /** The password entered by the user. */
  password: string
  /** The new password entered by the user if changing their password. */
  newPassword: string
  /**
   * The new password repeated by the user if changing their password to ensure
   * they do type it in wrong.
   */
  newPasswordConfirmed: string
  /**
   * The code sent to the user after requesting a password reset by starting the
   * "forgot password" process.
   */
  code: string
}): {
  /** Open redirect user to the Google sign-in page. */
  loginWithGoogle: () => void
  /**
   * Attempt to use the `username` and `password` arguments to create a session.
   * Will call `onLogin()` if successful, otherwise will set `loginError`.
   */
  loginWithUsernamePassword: () => void
  /** `true` while processing `loginWithUsernamePassword()`. */
  isLoggingIn: boolean
  /**
   * `true` if the user logged in using a temporary password. Prompt the user
   * for a new password and call `resetTemporaryPassword()`.
   */
  isPasswordTemporary: boolean
  /**
   * Attempt to use `newPassword` and `newPasswordConfirmed` arguments to reset
   * the user's password and create a session. Will call `onLogin()` if
   * successful, otherwise will set `loginError`.
   */
  resetTemporaryPassword: () => void
  /**
   * Set if an error occurs while processing `loginWithUsernamePassword()` or
   * `resetTemporaryPassword()`.
   */
  loginError: Error | null
  /** Set `loginError` back to `null`. */
  clearLoginError: () => void
  /** `true` while processing `resetTemporaryPassword()`. */
  isResettingTemporaryPassword: boolean
  /** `true` when showing the forgot password flow. */
  isShowingForgotPassword: boolean
  /** Set `isShowingForgotPassword` to `true`. */
  showForgotPassword: () => void
  /** Set `isShowingForgotPassword` to `false`. */
  hideForgotPassword: () => void
  /**
   * Attempt to use the `username` argument to start the forgot password
   * process. This will send the user an email with a code to enter. A failed
   * request will set `forgotPasswordError`.
   */
  sendForgotPasswordCode: () => void
  /** `true` while processing `sendForgotPasswordCode()`. */
  isSendingForgotPasswordCode: boolean
  /** `true` if the forgot password code has been successfully sent to the user. */
  hasSentForgotPasswordCode: boolean
  /**
   * Attempt to use the `code`, `newPassword`, and `newPasswordConfirmed`
   * arguments to reset the user's password. A failed request will set
   * `forgotPasswordError`.
   */
  resetForgottenPassword: () => void
  /** `true` while processing `resetForgottenPassword()`. */
  isResettingForgottenPassword: boolean
  /**
   * Set if an error occurs while processing `sendForgotPasswordCode()` or
   * `resetForgottenPassword()`.
   */
  forgotPasswordError: Error | null
  /** Set `forgotPasswordError` back to `null`. */
  clearForgotPasswordError: () => void
  usernameValidation: {
    /** `true` if the `username` argument is invalid. */
    isInvalid: boolean
  }
  passwordValidation: {
    /** `true` if the `password` argument is invalid. */
    isInvalid: boolean
  }
  codeValidation: {
    /** `true` if the `code` argument is invalid. */
    isInvalid: boolean
  }
  newPasswordValidation: {
    /** `true` if the `newPassword` argument is invalid. */
    isInvalid: boolean
    /**
     * `true` if the `newPassword` argument has a lowercase letter (required to
     * be valid).
     */
    hasLowercaseLetter: boolean
    /**
     * `true` if the `newPassword` argument has an uppercase letter (required to
     * be valid).
     */
    hasUpperCaseLetter: boolean
    /** `true` if the `newPassword` argument has a number (required to be valid). */
    hasNumber: boolean
    /**
     * `true` if the `newPassword` argument has a special character (required to
     * be valid).
     */
    hasSpecialCharacter: boolean
    /**
     * `true` if the `newPassword` argument has at least the minimum number of
     * characters (required to be valid).
     */
    hasMinLength: boolean
  }
  newPasswordConfirmedValidation: {
    /**
     * `true` if the `newPasswordConfirmed` argument is invalid (must match the
     * `newPassword` argument).
     */
    isInvalid: boolean
  }
  /**
   * `true` if the user logged in using MFA and a code is required to finish the
   * login attempt. Prompt the user for a code and call `submitMfaCode()`.
   */
  isMfaCodeRequired: boolean
  /** `true` while processing `submitMfaCode()`. */
  isSubmittingMfaCode: boolean
  /**
   * Attempt to use `code` argument to submit the MFA code and create a session.
   * Will call `onLogin()` if successful, otherwise will set `loginError`.
   */
  submitMfaCode: () => void
} {
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
    /** Open redirect user to the Google sign in */
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
