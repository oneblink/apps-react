import { jwtDecode } from 'jwt-decode'

import { getCognitoIdToken } from './cognito'
import Sentry from '../Sentry'

import { OneBlinkAppsError } from '..'
let formsKeyToken: string | null | undefined = null

/**
 * Set the Forms Key token being used to make requests to the OneBlink API on
 * behalf of the user.
 *
 * #### Example
 *
 * ```js
 * authService.setFormsKeyToken('a valid json web token')
 * ```
 *
 * @param jwtToken
 */
export function setFormsKeyToken(jwtToken: string | undefined | null): void {
  formsKeyToken = jwtToken || null
}

/**
 * Can be used to extract the `keyId` from the Forms Key token passed to
 * `setFormsKeyToken()`. Will be `undefined` if the token has not been set yet.
 *
 * #### Example
 *
 * ```js
 * const keyId = authService.getFormsKeyId()
 * if (keyId) {
 *   // Use keyId here...
 * }
 * ```
 *
 * @returns
 */
export function getFormsKeyId(): string | void {
  if (formsKeyToken) {
    console.log('Attempting to decode JWT')
    try {
      const tokenPayload = jwtDecode(formsKeyToken) as { iss: string }
      return tokenPayload.iss
    } catch (error) {
      Sentry.captureException(error)
      console.warn('Could not decode JWT', error)
    }
  }
}

/**
 * Get the Id Token used to make requests to the OneBlink API. This will return
 * `undefined` if the current user is not logged in.
 *
 * #### Example
 *
 * ```js
 * const idToken = await authService.getIdToken()
 * if (idToken) {
 *   await fetch(url, {
 *     headers: {
 *       Authorization: `Bearer ${idToken}`,
 *     },
 *   })
 * } else {
 *   // Handle user not being logged in
 * }
 * ```
 *
 * @returns
 */
export async function getIdToken() {
  if (formsKeyToken) {
    return formsKeyToken
  }

  try {
    return await getCognitoIdToken()
  } catch (error) {
    if (!(error as OneBlinkAppsError).requiresLogin) {
      Sentry.captureException(error)
      throw error
    }
  }
}
