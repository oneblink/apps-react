# OneBlink Apps - ReactJS | Usage

## `useLogin()`

This function is a react hook to help writing your own login screen.

## Parameters

The hook takes a single argument as an object with the following properties:

| Property                  | Type         | Description                                                                                            |
| ------------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| `username`                | `string`     | The email address entered by the user.                                                                 |
| `password`                | `string`     | The password entered by the user.                                                                      |
| `newPassword`             | `string`     | The new password entered by the user if changing their password.                                       |
| `newPasswordConfirmation` | `string`     | The new password repeated by the user if changing their password to ensure they do type it in wrong.   |
| `code`                    | `string`     | The code sent to the user after requesting a password reset by starting the "forgot password" process. |
| `onLogin`                 | `() => void` | A function run after a successful login. (mostly likely to navigate back to the application)           |

## Returns

The return type is an object with the following properties:

| Property                                    | Type              | Description                                                                                                                                                                               |
| ------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loginWithGoogle`                           | `() => void`      | Open redirect user to the Google sign in page.                                                                                                                                            |
| `loginWithUsernamePassword`                 | `() => void`      | Attempt to use the `username` and `password` arguments to create a session. Will call `onLogin()` if successful, otherwise will set `loginError`.                                         |
| `isLoggingIn`                               | `boolean`         | `true` while processing `loginWithUsernamePassword()`.                                                                                                                                    |
| `isPasswordTemporary`                       | `boolean`         | `true` if the user logged in using a temporary password. Prompt the user for a new password and call `resetTemporaryPassword()`                                                           |
| `resetTemporaryPassword`                    | `() => void`      | Attempt to use `newPassword` and `newPasswordConfirmed` arguments to reset the users password and create a session. Will call `onLogin()` if successful, otherwise will set `loginError`. |
| `loginError`                                | `Error` \| `null` | Set if an error occurs while processing `loginWithUsernamePassword()` or `resetTemporaryPassword()`.                                                                                      |
| `clearLoginError`                           | `() => void`      | Set `loginError` back to `null`                                                                                                                                                           |
| `isResettingTemporaryPassword`              | `boolean`         | `true` while processing `resetTemporaryPassword()`                                                                                                                                        |
| `isShowingForgotPassword`                   | `boolean`         | `true` showing the forgot password flow.                                                                                                                                                  |
| `showForgotPassword`                        | `() => void`      | Set `isShowingForgotPassword` to `true`.                                                                                                                                                  |
| `hideForgotPassword`                        | `() => void`      | Set `isShowingForgotPassword` to `false`.                                                                                                                                                 |
| `sendForgotPasswordCode`                    | `() => void`      | Attempt to use the `username` argument to start the forgot password process. This will send the user an email with a code to entered. A failed request will set `forgotPasswordError`.    |
| `isSendingForgotPasswordCode`               | `boolean`         | `true` while processing `sendForgotPasswordCode()`                                                                                                                                        |
| `hasSentForgotPasswordCode`                 | `boolean`         | `true` if forgot password code has been successfully sent to the user                                                                                                                     |
| `resetForgottenPassword`                    | `() => void`      | Attempt to use the `code`, `newPassword`, and `newPasswordConfirmed` arguments to reset the users password. A failed request will set `forgotPasswordError`.                              |
| `isResettingForgottenPassword`              | `boolean`         | `true` while processing `resetForgottenPassword()`                                                                                                                                        |
| `forgotPasswordError`                       | `Error` \| `null` | Set if an error occurs while processing `sendForgotPasswordCode()` or `resetForgottenPassword()`.                                                                                         |
| `clearForgotPasswordError`                  | `() => void`      | Set `loginError` back to `null`                                                                                                                                                           |
| `usernameValidation.isInvalid`              | `boolean`         | `true` if the `username` argument is invalid                                                                                                                                              |
| `passwordValidation.isInvalid`              | `boolean`         | `true` if the `password` argument is invalid                                                                                                                                              |
| `codeValidation.isInvalid`                  | `boolean`         | `true` if the `code` argument is invalid                                                                                                                                                  |
| `newPasswordValidation.isInvalid`           | `boolean`         | `true` if the `newPassword` argument is invalid                                                                                                                                           |
| `newPasswordValidation.hasLowercaseLetter`  | `boolean`         | `true` if the `newPassword` argument has a lowercase letter (required to be valid)                                                                                                        |
| `newPasswordValidation.hasUpperCaseLetter`  | `boolean`         | `true` if the `newPassword` argument has an upper case letter (required to be valid)                                                                                                      |
| `newPasswordValidation.hasNumber`           | `boolean`         | `true` if the `newPassword` argument has a number (required to be valid)                                                                                                                  |
| `newPasswordValidation.hasSpecialCharacter` | `boolean`         | `true` if the `newPassword` argument has a special character (required to be valid)                                                                                                       |
| `newPasswordValidation.hasMinLength`        | `boolean`         | `true` if the `newPassword` argument has a at least the minimum number of characters (required to be valid)                                                                               |
| `newPasswordConfirmedValidation.isInvalid`  | `boolean`         | `true` if the `newPasswordConfirmed` argument is invalid (must match the `newPassword` argument)                                                                                          |
| `isMfaCodeRequired`                         | `boolean`         | `true` if the user logged in using a MFA and a code is required to finish login attempt. Prompt the user for a code and call `submitMfaCode()`                                            |
| `isSubmittingMfaCode`                       | `boolean`         | `true` while processing `submitMfaCode()`                                                                                                                                                 |
| `submitMfaCode`                             | `() => void`      | Attempt to use `code` arguments to submit the MFA code and create a session. Will call `onLogin()` if successful, otherwise will set `loginError`.                                        |

## Example

```jsx
import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useLogin } from '@oneblink/apps-react'

function App() {
  const history = useHistory()

  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [newPasswordConfirmed, setNewPasswordConfirmed] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [code, setCode] = React.useState('')

  const onLogin = React.useCallback(() => {
    history.push('/')
  }, [history])

  const {
    // Login
    loginWithGoogle,
    loginWithUsernamePassword,
    isLoggingIn,
    // Reset Temp Password
    isPasswordTemporary,
    isResettingTemporaryPassword,
    resetTemporaryPassword,
    // MFA Password
    isMfaCodeRequired,
    isSubmittingMfaCode,
    submitMfaCode,
    // Login Errors
    loginError,
    clearLoginError,
    // Showing Forgot Password
    isShowingForgotPassword,
    showForgotPassword,
    hideForgotPassword,
    // Sending Forgot Password Code
    isSendingForgotPasswordCode,
    sendForgotPasswordCode,
    // Resetting Forgotten Password
    hasSentForgotPasswordCode,
    isResettingForgottenPassword,
    resetForgottenPassword,
    // Forgot Password Errors
    forgotPasswordError,
    clearForgotPasswordError,
    // Validation
    usernameValidation,
    passwordValidation,
    codeValidation,
    newPasswordValidation,
    newPasswordConfirmedValidation,
  } = useLogin({
    username,
    password,
    newPassword,
    newPasswordConfirmed,
    code,
    onLogin,
  })

  if (hasSentForgotPasswordCode) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          resetForgottenPassword()
        }}
      >
        <p>We have sent you a password reset code via email. Enter it below to reset your password.</p>

        <input
          type="password"
          placeholder="Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={newPassword}
          onChange={(e) => setNewPasswordConfirmed(e.target.value)}
        />

        <button
          type="submit"
          disabled={isResettingForgottenPassword || codeValidation.isInvalid || newPasswordValidation.isInvalid || newPasswordConfirmedValidation.isInvalid}
        >
          Change Password
        </button>

        <p>Password Requirements</p>
        <p>Contains a lowercase letter: {validation.hasLowercaseLetter ? 'Yes' : 'No'}</p>
        <p>Contains an upper case letter: {validation.hasUpperCaseLetter ? 'Yes' : 'No'}</p>
        <p>Contains a number: {validation.hasNumber ? 'Yes' : 'No'}</p>
        <p>Contains a special character: {validation.hasSpecialCharacter ? 'Yes' : 'No'}</p>
        <p>Contains at least 8 characters: {validation.hasMinLength ? 'Yes' : 'No'}</p>

        {forgotPasswordError && (
          <p>{forgotPasswordError.message}</p>
          <button type="button" onClick={clearForgotPasswordError}>Clear Error</button>
        )}
      </form>
    )
  }

  if (isShowingForgotPassword) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendForgotPasswordCode()
        }}
      >
        <p>Enter your email address and we will send you a code to reset your password.</p>

        <input
          type="email"
          placeholder="Email Address"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <p>
          <a onClick={hideForgotPassword}>Remembered your password?</a>
        </p>

        <button
          type="submit"
          disabled={isSendingForgotPasswordCode || usernameValidation.isInvalid}
        >
          Reset Password
        </button>

        {forgotPasswordError && (
          <p>{forgotPasswordError.message}</p>
          <button type="button" onClick={clearForgotPasswordError}>Clear Error</button>
        )}
      </form>
    )
  }

  if (isPasswordTemporary) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          resetTemporaryPassword()
        }}
      >
        <p>The password you entered was only temporary and must be reset for security purposes. Please enter your new password below to continue.</p>

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={newPassword}
          onChange={(e) => setNewPasswordConfirmed(e.target.value)}
        />

        <button
          type="submit"
          disabled={isResettingTemporaryPassword || newPasswordValidation.isInvalid || newPasswordConfirmedValidation.isInvalid}
        >
          Change Password &amp; Sign In
        </button>

        <p>Password Requirements</p>
        <p>Contains a lowercase letter: {validation.hasLowercaseLetter ? 'Yes' : 'No'}</p>
        <p>Contains an upper case letter: {validation.hasUpperCaseLetter ? 'Yes' : 'No'}</p>
        <p>Contains a number: {validation.hasNumber ? 'Yes' : 'No'}</p>
        <p>Contains a special character: {validation.hasSpecialCharacter ? 'Yes' : 'No'}</p>
        <p>Contains at least 8 characters: {validation.hasMinLength ? 'Yes' : 'No'}</p>

        {loginError && (
          <p>{loginError.message}</p>
          <button type="button" onClick={clearLoginError}>Clear Error</button>
        )}
      </form>
    )
  }

  if (isMfaCodeRequired) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submitMfaCode()
        }}
      >
        <p>Enter the 6-digit code found in your authenticator app.</p>

        <input
          type="password"
          placeholder="Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button
          type="submit"
          disabled={isSubmittingMfaCode || codeValidation.isInvalid}
        >
          Sign In
        </button>

        {loginError && (
          <p>{loginError.message}</p>
          <button type="button" onClick={clearLoginError}>Clear Error</button>
        )}
      </form>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        loginWithUsernamePassword()
      }}
    >
      <p>Sign in with your email address and password.</p>
      <input
        type="email"
        placeholder="Email Address"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <p>
        <a onClick={showForgotPassword}>Forgot your password?</a>
      </p>

      <button
        type="submit"
        disabled={isLoggingIn || usernameValidation.isInvalid || passwordValidation.isInvalid}
      >
        {children}
      </button>

      <p>or</p>

      <button
        type="button"
        onClick={loginWithGoogle}
      >
        <img
          alt="Google"
          src="google-sign-in.png"
        />
        <span>Sign in with Google</span>
      </button>

      {loginError && (
        <p>{loginError.message}</p>
        <button type="button" onClick={clearLoginError}>Clear Error</button>
      )}
    </form>
  )
}

const root = document.getElementById('root')
if (root) {
  ReactDOM.render(<App />, root)
}
```
