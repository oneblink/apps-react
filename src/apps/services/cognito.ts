import { jwtDecode } from 'jwt-decode'

import AWSCognitoClient, {
  DEFAULT_MFA_SETTINGS,
  LoginAttemptResponse,
  MfaMethod,
  MfaRequirementCheckResult,
  MfaSettings,
} from './AWSCognitoClient'

import * as offlineService from '../offline-service'
import { userService } from '@oneblink/sdk-core'
import { MiscTypes } from '@oneblink/types'
import { HTTPError, postRequest } from './fetch'
import tenants from '../tenants'
import OneBlinkAppsError from './errors/oneBlinkAppsError'

interface CognitoServiceData {
  oAuthClientId: string
  loginDomain: string
  region: string
  redirectUri: string
  logoutUri: string
}

const CONTINUE_TO = 'continueTo'

let awsCognitoClient: null | AWSCognitoClient = null

function init(cognitoServiceData: CognitoServiceData) {
  console.log('Initiating CognitoIdentityServiceProvider', cognitoServiceData)

  awsCognitoClient = new AWSCognitoClient({
    clientId: cognitoServiceData.oAuthClientId,
    region: cognitoServiceData.region,
    loginDomain: cognitoServiceData.loginDomain,
    redirectUri: cognitoServiceData.redirectUri,
    logoutUri: cognitoServiceData.logoutUri,
  })
}

/**
 * Register a listener function that will be call when authentication tokens are
 * updated or removed.
 *
 * #### Example
 *
 * ```js
 * const listener = async () => {
 *   // Check if the user is logged in still
 *   const isLoggedIn = authService.isLoggedIn()
 * }
 * const deregister = await authService.registerAuthListener(listener)
 *
 * // When no longer needed, remember to deregister the listener
 * deregister()
 * ```
 *
 * @param listener
 * @returns
 */
function registerAuthListener(listener: () => unknown): () => void {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to register a listener.',
    )
  }
  return awsCognitoClient.registerListener(listener)
}

/**
 * Create a session for a user by entering a username and password. If the user
 * requires a password reset, the "resetPasswordCallback" property will be
 * returned. This function should be called with the new password once entered
 * by the user. If the user requires an MFA token, the "mfa" property will be
 * returned. Its "codeCallback" should be called with the one-time token. The
 * functions returned are recursive and the result from each of them is the same
 * result from the loginUsernamePassword() function. Each time the response
 * includes a callback, you will need to begin the process again until all
 * callbacks are handled.
 *
 * #### Example
 *
 * ```js
 * async function handleLoginAttemptResponse({
 *   resetPasswordCallback,
 *   mfa,
 * }) {
 *   // "resetPasswordCallback" will be undefined if a password reset was not required.
 *   if (resetPasswordCallback) {
 *     // Prompt the user to enter a new password
 *     const newPassword = prompt(
 *       'The password you entered was only temporary, and must be reset for security purposes. Please enter your new password below to continue.',
 *     )
 *     const resetPasswordResponse =
 *       await resetPasswordCallback(newPassword)
 *     return await handleLoginAttemptResponse(resetPasswordResponse)
 *   }
 *
 *   // "mfa" will be undefined if MFA is not setup.
 *   if (mfa) {
 *     // Prompt the user to enter an MFA code
 *     const code = prompt(
 *       mfa.method === 'email'
 *         ? 'Please enter the one-time code sent to your email.'
 *         : 'Please enter a one-time code from your MFA app.',
 *     )
 *     const mfaCodeResponse = await mfa.codeCallback(code)
 *     return await handleLoginAttemptResponse(mfaCodeResponse)
 *   }
 * }
 *
 * const username = 'user@email.io'
 * const password = 'P@$5w0rd'
 *
 * const loginAttemptResponse = await authService.loginUsernamePassword(
 *   username,
 *   password,
 * )
 *
 * await handleLoginAttemptResponse(loginAttemptResponse)
 * ```
 *
 * @param username
 * @param password
 * @returns
 */
async function loginUsernamePassword(username: string, password: string) {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to login.',
    )
  }
  console.log('Attempting sign using username', username)
  return awsCognitoClient.loginUsernamePassword(
    username.toLowerCase(),
    password,
  )
}

/**
 * Redirect the user to the login screen. Passing an `identityProvider` is
 * optionally, it will allow users to skip the login page and be directed
 * straight to that providers login page
 *
 * #### Example
 *
 * ```js
 * // OPtionally pass a
 * const identityProvider = 'Google'
 * await authService.loginHostedUI(identityProvider)
 * // User will be redirected to login page or promise will resolve
 * ```
 *
 * @param identityProviderName
 * @returns
 */
async function loginHostedUI(identityProviderName?: string): Promise<void> {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to login.',
    )
  }
  const continueTo = `${window.location.pathname}${window.location.search}`
  localStorage.setItem(CONTINUE_TO, continueTo)

  return awsCognitoClient.loginHostedUI(identityProviderName)
}

/**
 * This function should be called when the user is redirected back to your app
 * after a login attempt. It will use the query string add the redirect URL to
 * create a session for the current user. It will return a URL as a `string`
 * that should be redirected to within your app.
 *
 * #### Example
 *
 * ```js
 * try {
 *   const continueTo = await authService.handleAuthentication()
 *   // Redirect the user back to where they were before attempting to login
 *   window.location.href = continueTo
 * } catch (error) {
 *   // handle failed login attempts here.
 * }
 * ```
 *
 * @returns
 */
async function handleAuthentication(): Promise<string> {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to handle authentication in URL.',
    )
  }

  const continueTo = localStorage.getItem(CONTINUE_TO) || '/'
  if (isLoggedIn()) {
    console.log('Already authenticated, redirecting to:', continueTo)
  } else {
    await awsCognitoClient.handleAuthentication()
  }

  localStorage.removeItem(CONTINUE_TO)

  return continueTo
}

/**
 * Allow the currently logged in user to change their password by passing their
 * existing password and a new password.
 *
 * #### Example
 *
 * ```js
 * const currentPassword = 'P@$5w0rd'
 * const newPassword = 'P@$5w0rD'
 * await authService.changePassword(currentPassword, newPassword)
 * ```
 *
 * @param existingPassword
 * @param newPassword
 * @returns
 */
async function changePassword(existingPassword: string, newPassword: string) {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to change passwords.',
    )
  }

  return await awsCognitoClient.changePassword(existingPassword, newPassword)
}

/**
 * Allow a user to start the forgot password process. The user will be emailed a
 * temporary code that must be passed with a new password to the function
 * returned.
 *
 * #### Example
 *
 * ```js
 * const username = 'user@email.io'
 * const finishForgotPassword = await authService.forgotPassword(username)
 *
 * // Prompt the user to enter the code and a new password
 * const code = prompt(
 *   'You have been emailed a verification code, please enter it here.',
 * )
 * const newPassword = prompt('Please enter a new password to continue.')
 * await finishForgotPassword(code, newPassword)
 * ```
 *
 * @param username
 * @param formsAppId Used to give the resulting email sent to the user
 *   associated forms app branding and sending address
 * @returns
 */
async function forgotPassword(
  username: string,
  /**
   * Used to give the resulting email sent to the user associated forms app
   * branding and sending address
   */
  formsAppId?: number,
): Promise<(code: string, password: string) => Promise<void>> {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before starting the forgot password process.',
    )
  }

  try {
    const url = `${tenants.current.apiOrigin}/authentication/reset-password`
    await postRequest(url, {
      username,
      formsAppId,
    })
  } catch (err) {
    const error = err as HTTPError
    switch (error.status) {
      case 400: {
        throw new OneBlinkAppsError(error.message, {
          title: 'Invalid Request',
          httpStatusCode: error.status,
        })
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }

  return async (code, password) => {
    await awsCognitoClient?.confirmForgotPassword({
      username,
      code,
      password,
    })
  }
}

/**
 * Redirect the user to the logout screen to clear the users session on the
 * hosted login page. User will then be redirected to `/logout`. After being
 * redirected back to the application, the `logout()` function should be called
 * to clear the session data from browser storage.
 *
 * #### Example
 *
 * ```js
 * authService.logoutHostedUI()
 * ```
 */
function logoutHostedUI(): void {
  if (awsCognitoClient) {
    awsCognitoClient.logoutHostedUI()
  }
}

async function logout() {
  if (awsCognitoClient) {
    await awsCognitoClient.logout()
  }
}

/**
 * Check if the user is currently logged in
 *
 * #### Example
 *
 * ```js
 * const isLoggedIn = authService.isLoggedIn()
 * // handle user being logged in or not
 * ```
 *
 * @returns
 */
function isLoggedIn(): boolean {
  return !!(awsCognitoClient && awsCognitoClient._getRefreshToken())
}

async function getCognitoIdToken(): Promise<string | undefined> {
  if (!awsCognitoClient) {
    return
  }

  if (offlineService.isOffline()) {
    return awsCognitoClient._getIdToken()
  }

  return await awsCognitoClient.getIdToken()
}

/**
 * Get current users profile based on there Id Token payload. This will return
 * `null` if the the current user is not logged in.
 *
 * #### Example
 *
 * ```js
 * const profile = authService.getUserProfile()
 * if (profile) {
 *   // Use profile here
 * }
 * ```
 *
 * @returns
 */
function getUserProfile(): MiscTypes.UserProfile | null {
  if (!awsCognitoClient) {
    return null
  }
  const idToken = awsCognitoClient._getIdToken()
  if (!idToken) {
    return null
  }

  const jwtToken = jwtDecode(idToken)
  return userService.parseUserProfile(jwtToken) || null
}

export function getUsername(): string | undefined {
  const profile = getUserProfile()
  if (!profile) {
    return undefined
  }

  return profile.username
}

/**
 * A friendly `string` that represents the current user. Uses first name, last
 * name, full name and username. This will return `null` the current user is not
 * logged in.
 *
 * #### Example
 *
 * ```js
 * const name = authService.getUserFriendlyName()
 * if (name) {
 *   // Display current user's name
 * }
 * ```
 *
 * @returns
 */
function getUserFriendlyName(): string | undefined {
  const profile = getUserProfile()
  if (!profile) {
    return
  }

  return userService.getUserFriendlyName(profile)
}

/**
 * Generate a QR code link to display to a user after they have initiated MFA
 * setup.
 *
 * #### Example
 *
 * ```js
 * const mfaSetupQrCodeUrl = authService.generateMfaQrCodeUrl()
 * if (mfaSetupQrCodeUrl) {
 *   // use mfaSetupQrCodeUrl to display QR code to user
 * }
 * ```
 *
 * @returns
 */
function generateMfaQrCodeUrl(
  mfaSetupConfiguration: Awaited<ReturnType<typeof setupMfa>>,
): string | undefined {
  const profile = getUserProfile()
  if (!profile || !mfaSetupConfiguration) {
    return
  }

  return `otpauth://totp/${tenants.current.productShortName}:${profile.email}?secret=${mfaSetupConfiguration.secretCode}&issuer=${tenants.current.productShortName}`
}

/**
 * Check if the current user meets an MFA requirement.
 *
 * #### Example
 *
 * ```js
 * const { mfaSettings, userMeetsMfaRequirement } =
 *   await authService.checkIsMfaEnabled('any')
 * if (userMeetsMfaRequirement) {
 *   // User has met the MFA requirement
 * } else {
 *   // Prompt user to set up MFA
 * }
 * ```
 *
 * @returns
 */
async function checkIsMfaEnabled(
  mfaRequirement: MiscTypes.MfaRequirement,
): Promise<MfaRequirementCheckResult> {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before checking if the current user has MFA enabled.',
    )
  }

  return await awsCognitoClient.checkIsMfaEnabled(mfaRequirement)
}

async function getMfaSettings(abortSignal?: AbortSignal) {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before checking MFA settings.',
    )
  }

  return await awsCognitoClient.getMfaSettings(abortSignal)
}

async function updateUserPhoneNumber(phoneNumber: string) {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before updating the user phone number.',
    )
  }

  return await awsCognitoClient.updateUserPhoneNumber(phoneNumber)
}

async function removeUserPhoneNumber() {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before removing the user phone number.',
    )
  }

  return await awsCognitoClient.removeUserPhoneNumber()
}

async function sendPhoneNumberVerificationCode() {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before sending a phone number verification code.',
    )
  }

  return await awsCognitoClient.sendPhoneNumberVerificationCode()
}

async function verifyUserPhoneNumber(code: string) {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before verifying the user phone number.',
    )
  }

  return await awsCognitoClient.verifyUserPhoneNumber(code)
}

async function setupSmsMfa(options?: { preferred?: boolean }) {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to setup SMS MFA.',
    )
  }

  return await awsCognitoClient.setupSmsMfa(options)
}

async function disableMfaMethod(method: MfaMethod) {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to disable an MFA method.',
    )
  }

  return await awsCognitoClient.disableMfaMethod(method)
}

async function setPreferredMfaMethod(method: MfaMethod) {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to set the preferred MFA method.',
    )
  }

  return await awsCognitoClient.setPreferredMfaMethod(method)
}

/**
 * Setup MFA for the current user. The result will include a callback that
 * should be called with the valid TOTP from an authenticator app.
 *
 * #### Example
 *
 * ```js
 * const { secretCode, mfaCodeCallback } = await authService.setupMfa()
 * // Prompt the user to enter an MFA code
 * const code = prompt(
 *   `Please enter a one-time code from your MFA app after creating a new entry with secret: ${secretCode}.`,
 * )
 * await mfaCodeCallback(code)
 * ```
 *
 * @returns
 */
async function setupMfa(options?: { preferred?: boolean }) {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to setup MFA.',
    )
  }

  return await awsCognitoClient.setupMfa(options)
}

export {
  init,
  registerAuthListener,
  loginUsernamePassword,
  loginHostedUI,
  handleAuthentication,
  changePassword,
  forgotPassword,
  logoutHostedUI,
  logout,
  isLoggedIn,
  getCognitoIdToken,
  getUserProfile,
  getUserFriendlyName,
  checkIsMfaEnabled,
  getMfaSettings,
  updateUserPhoneNumber,
  removeUserPhoneNumber,
  sendPhoneNumberVerificationCode,
  verifyUserPhoneNumber,
  disableMfaMethod,
  setPreferredMfaMethod,
  setupSmsMfa,
  setupMfa,
  generateMfaQrCodeUrl,
  DEFAULT_MFA_SETTINGS,
}
export type {
  LoginAttemptResponse,
  MfaMethod,
  MfaRequirementCheckResult,
  MfaSettings,
}
