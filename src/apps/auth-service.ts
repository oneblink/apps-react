import { MiscTypes } from '@oneblink/types'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import {
  getIdToken,
  getFormsKeyId,
  setFormsKeyToken,
} from './services/forms-key'
import {
  init as initCognito,
  registerAuthListener,
  isLoggedIn,
  loginHostedUI,
  loginUsernamePassword,
  changePassword,
  forgotPassword,
  handleAuthentication,
  logoutHostedUI,
  logout as logoutCognito,
  getUserProfile,
  getUsername,
  getUserFriendlyName,
  LoginAttemptResponse,
  checkIsMfaEnabled,
  disableMfa,
  setupMfa,
  generateMfaQrCodeUrl,
} from './services/cognito'
import { getRequest, postRequest, HTTPError } from './services/fetch'
import tenants from './tenants'
import { getUserToken, setUserToken } from './services/user-token'
import utilsService from './services/utils'

export {
  registerAuthListener,
  loginHostedUI,
  loginUsernamePassword,
  handleAuthentication,
  logoutHostedUI,
  changePassword,
  forgotPassword,
  isLoggedIn,
  getIdToken,
  getUserProfile,
  getFormsKeyId,
  setFormsKeyToken,
  getUserToken,
  setUserToken,
  getUserFriendlyName,
  LoginAttemptResponse,
  checkIsMfaEnabled,
  disableMfa,
  setupMfa,
  generateMfaQrCodeUrl,
}
import Sentry from './Sentry'

/**
 * Log the current user out and remove an data stored locally by the user e.g.
 * drafts.
 *
 * #### Example
 *
 * ```js
 * await authService.logout()
 * ```
 */
export async function logout() {
  console.log('Logging out...')

  try {
    await utilsService.localForage.clear()
  } catch (error) {
    Sentry.captureException(error)
    console.warn('Could not clear localForage before logging out', error)
  }

  await logoutCognito()
}

/**
 * Initialize the service with required configuration. **This must be done
 * before using before some of the function in this service.**
 *
 * #### Example
 *
 * ```js
 * authService.init({
 *   oAuthClientId: 'YOUR_OAUTH_CLIENT_ID',
 * })
 * ```
 *
 * @param options
 */
export function init({ oAuthClientId }: { oAuthClientId: string }) {
  initCognito({
    region: tenants.current.awsRegion,
    loginDomain: tenants.current.loginDomain,
    oAuthClientId,
    redirectUri: window.location.origin + '/callback',
    logoutUri: window.location.origin + '/logout',
  })

  const listener = () => {
    Sentry.setTag('username', getUsername() || undefined)
  }
  listener()
  registerAuthListener(listener)
}

/**
 * Determine if the current user is a OneBlink App User for a OneBlink Forms
 * App. Returns `false` if the current user is not logged in.
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const isAuthorised = await authService.isAuthorised(formsAppId)
 * if (!isAuthorised) {
 *   // handle unauthorised user
 * }
 * ```
 *
 * @param formsAppId
 * @param abortSignal
 * @returns
 */
export async function isAuthorised(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<boolean> {
  return getCurrentFormsAppUser(formsAppId, abortSignal)
    .then(() => true)
    .catch((error) => {
      if (error.status >= 400 && error.status < 500) {
        return false
      } else {
        Sentry.captureException(error)
        console.log(
          'Could not determine if the current user has access to this forms app',
          error,
        )
        return false
      }
    })
}

/**
 * Get the current user's App User details for a OneBlink Forms App. Returns
 * `undefined` if the current user is not logged in.
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const formsAppUserDetails =
 *   await authService.getCurrentFormsAppUser(formsAppId)
 * if (!formsAppUserDetails) {
 *   // handle unauthorised user
 * }
 * ```
 *
 * @param formsAppId
 * @returns
 */
export async function getCurrentFormsAppUser(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<
  | {
      userProfile?: MiscTypes.UserProfile
      formsAppId: number
      groups: string[]
    }
  | undefined
> {
  if (getFormsKeyId()) {
    return {
      formsAppId,
      groups: [],
    }
  }

  const userProfile = getUserProfile()

  if (!userProfile) {
    return undefined
  }

  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/my-forms-app-user`
  return await getRequest<{
    userProfile?: MiscTypes.UserProfile
    formsAppId: number
    groups: string[]
  }>(url, abortSignal)
}

/**
 * If the current user is not a Forms App User, this function will send a
 * request on behalf of the current user to the OneBlink Forms App
 * administrators to request access.
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * await authService.requestAccess(formsAppId)
 * // Display a message to user indicating a request has been sent to the application administrators
 * ```
 *
 * @param formsAppId
 */
export async function requestAccess(formsAppId: number): Promise<void> {
  if (!isLoggedIn()) {
    throw new OneBlinkAppsError(
      'You must login before requesting access to this application',
      {
        requiresLogin: true,
      },
    )
  }

  try {
    const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/request-access`
    await postRequest(url)
  } catch (error) {
    Sentry.captureException(error)
    console.warn('Error while requesting access to forms app', error)

    throw new OneBlinkAppsError(
      'Sorry, we could not request access automatically right now, please try again. If the problem persists, please contact your administrator yourself.',
      {
        originalError: error as Error,
        title: 'Error Requesting Access',
        httpStatusCode: (error as HTTPError).status,
      },
    )
  }
}

/**
 * Allow a user to sign up to a forms app.
 *
 * #### Example
 *
 * ```js
 * await authService.signUp({
 *   formsAppId: 1,
 *   email: 'test@oneblink.io',
 *   firstName: 'first',
 *   lastName: 'last',
 * })
 * ```
 *
 * @param {formsAppId, email, generatePassword, firstName, lastName}
 * @returns
 */

export async function signUp({
  formsAppId,
  email,
  firstName,
  lastName,
}: {
  formsAppId: number
  email: string
  firstName?: string
  lastName?: string
}): Promise<void> {
  try {
    const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/sign-up`
    return await postRequest(url, {
      email,
      firstName,
      lastName,
    })
  } catch (error) {
    Sentry.captureException(error)
    console.warn('Error while calling sign-up to forms app', error)

    throw new OneBlinkAppsError(
      'Sorry, we could not create you a account right now, please try again. If the problem persists, please contact your administrator yourself.',
      {
        originalError: error as Error,
        title: 'Error Signing up',
        httpStatusCode: (error as HTTPError).status,
      },
    )
  }
}
