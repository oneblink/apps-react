import {
  AssociateSoftwareTokenCommand,
  AuthenticationResultType,
  ChangePasswordCommand,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  InitiateAuthCommand,
  InitiateAuthResponse,
  RespondToAuthChallengeCommand,
  SetUserMFAPreferenceCommand,
  VerifySoftwareTokenCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import Sentry from '../Sentry'
import { OneBlinkAppsError } from '..'

export type LoginAttemptResponse = {
  resetPasswordCallback?: (newPassword: string) => Promise<LoginAttemptResponse>
  mfaCodeCallback?: (code: string) => Promise<LoginAttemptResponse>
}

export default class AWSCognitoClient {
  clientId: string
  cognitoIdentityProviderClient: CognitoIdentityProviderClient
  loginDomain: string | void
  redirectUri: string | void
  logoutUri: string | void
  listeners: Array<() => unknown>

  constructor({
    clientId,
    region,
    loginDomain,
    redirectUri,
    logoutUri,
  }: {
    clientId: string
    region: string
    redirectUri?: string
    logoutUri?: string
    loginDomain?: string
  }) {
    if (!clientId) {
      throw new TypeError('"clientId" is required in constructor')
    }
    if (!region) {
      throw new TypeError('"region" is required in constructor')
    }

    this.listeners = []
    this.redirectUri = redirectUri
    this.logoutUri = logoutUri
    this.loginDomain = loginDomain
    this.clientId = clientId
    this.cognitoIdentityProviderClient = new CognitoIdentityProviderClient({
      region,
    })
  }

  // Local Storage Keys
  get EXPIRES_AT() {
    return `COGNITO_${this.clientId}_EXPIRES_AT`
  }
  get ACCESS_TOKEN() {
    return `COGNITO_${this.clientId}_ACCESS_TOKEN`
  }
  get ID_TOKEN() {
    return `COGNITO_${this.clientId}_ID_TOKEN`
  }
  get REFRESH_TOKEN() {
    return `COGNITO_${this.clientId}_REFRESH_TOKEN`
  }
  get STATE() {
    return `COGNITO_${this.clientId}_STATE`
  }
  get PKCE_CODE_VERIFIER() {
    return `COGNITO_${this.clientId}_PKCE_CODE_VERIFIER`
  }

  _executeListeners() {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (error) {
        Sentry.captureException(error)
        // Ignore error from listeners
        console.warn('AWSCognitoClient listener error', error)
      }
    }
  }

  _storeAuthenticationResult(authenticationResult: AuthenticationResultType) {
    // Take off 5 seconds to ensure a request does not become unauthenticated mid request
    const expiresAt =
      (authenticationResult.ExpiresIn as number) * 1000 + Date.now() - 5000
    localStorage.setItem(this.EXPIRES_AT, expiresAt.toString())
    localStorage.setItem(
      this.ACCESS_TOKEN,
      authenticationResult.AccessToken as string,
    )
    localStorage.setItem(this.ID_TOKEN, authenticationResult.IdToken as string)
    if (authenticationResult.RefreshToken) {
      localStorage.setItem(
        this.REFRESH_TOKEN,
        authenticationResult.RefreshToken,
      )
    }

    this._executeListeners()
  }

  _removeAuthenticationResult() {
    localStorage.removeItem(this.EXPIRES_AT)
    localStorage.removeItem(this.ACCESS_TOKEN)
    localStorage.removeItem(this.ID_TOKEN)
    localStorage.removeItem(this.REFRESH_TOKEN)

    this._executeListeners()
  }

  _getAccessToken(): string | undefined {
    return localStorage.getItem(this.ACCESS_TOKEN) || undefined
  }

  _getIdToken(): string | undefined {
    return localStorage.getItem(this.ID_TOKEN) || undefined
  }

  _getRefreshToken(): string | undefined {
    return localStorage.getItem(this.REFRESH_TOKEN) || undefined
  }

  _isSessionValid(): boolean {
    const expiresAt = localStorage.getItem(this.EXPIRES_AT)
    if (!expiresAt) {
      return false
    }
    return parseInt(expiresAt, 10) > Date.now()
  }

  async _refreshSession(): Promise<void> {
    if (this._isSessionValid()) {
      return
    }

    const refreshToken = this._getRefreshToken()
    if (!refreshToken) {
      return
    }

    try {
      const result = await this.cognitoIdentityProviderClient.send(
        new InitiateAuthCommand({
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          ClientId: this.clientId,
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
          },
        }),
      )
      if (result.AuthenticationResult) {
        this._storeAuthenticationResult(result.AuthenticationResult)
      }
    } catch (error) {
      console.warn('Error while attempting to refresh session', error)
      this._removeAuthenticationResult()
      throw new OneBlinkAppsError(
        'Your session has expired. Please login again to continue to use the application.',
        {
          requiresLogin: true,
          originalError: error as Error,
        },
      )
    }
  }

  registerListener(listener: () => unknown): () => void {
    this.listeners.push(listener)

    return () => {
      const index = this.listeners.indexOf(listener)
      if (index !== -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  async responseToAuthChallenge(
    username: string,
    initiateAuthResponse: InitiateAuthResponse,
  ): Promise<LoginAttemptResponse> {
    if (initiateAuthResponse.AuthenticationResult) {
      this._storeAuthenticationResult(initiateAuthResponse.AuthenticationResult)
      return {}
    }

    const ChallengeName = initiateAuthResponse.ChallengeName
    switch (ChallengeName) {
      case 'NEW_PASSWORD_REQUIRED': {
        return {
          resetPasswordCallback: async (newPassword) => {
            const resetPasswordResult =
              await this.cognitoIdentityProviderClient.send(
                new RespondToAuthChallengeCommand({
                  ChallengeName,
                  ClientId: this.clientId,
                  Session: initiateAuthResponse.Session,
                  ChallengeResponses: {
                    USERNAME: username,
                    NEW_PASSWORD: newPassword,
                  },
                }),
              )
            return await this.responseToAuthChallenge(
              username,
              resetPasswordResult,
            )
          },
        }
      }
      case 'SOFTWARE_TOKEN_MFA': {
        return {
          mfaCodeCallback: async (code) => {
            const resetPasswordResult =
              await this.cognitoIdentityProviderClient.send(
                new RespondToAuthChallengeCommand({
                  ChallengeName,
                  ClientId: this.clientId,
                  Session: initiateAuthResponse.Session,
                  ChallengeResponses: {
                    USERNAME: username,
                    SOFTWARE_TOKEN_MFA_CODE: code,
                  },
                }),
              )
            return await this.responseToAuthChallenge(
              username,
              resetPasswordResult,
            )
          },
        }
      }
    }

    console.warn(
      '"CognitoIdentityServiceProvider.InitiateAuthResponse" challenge has not been catered.',
      initiateAuthResponse,
    )
    throw new Error(
      'An unexpected error occurred while attempting to process your login. Please try again or contact support if the problem persists.',
    )
  }

  async loginUsernamePassword(
    username: string,
    password: string,
  ): Promise<LoginAttemptResponse> {
    const loginResult = await this.cognitoIdentityProviderClient.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      }),
    )

    return await this.responseToAuthChallenge(username, loginResult)
  }

  async loginHostedUI(identityProviderName?: string): Promise<void> {
    const loginDomain = this.loginDomain
    const redirectUri = this.redirectUri
    if (!loginDomain || !redirectUri) {
      throw new TypeError(
        '"loginDomain" or "redirectUri" was not passed to constructor. Both are required before attempting to login.',
      )
    }

    // Create and store a random "state" value
    const state = generateRandomString()
    localStorage.setItem(this.STATE, state)

    // Create and store a new PKCE code_verifier (the plaintext random secret)
    const codeVerifier = generateRandomString()
    localStorage.setItem(this.PKCE_CODE_VERIFIER, codeVerifier)

    // Hash and base64-urlencode the secret to use as the challenge
    const code_challenge = await pkceChallengeFromVerifier(codeVerifier)

    window.location.href =
      `https://${loginDomain}/oauth2/authorize` +
      '?response_type=code' +
      '&client_id=' +
      encodeURIComponent(this.clientId) +
      '&state=' +
      encodeURIComponent(state) +
      '&scope=' +
      encodeURIComponent('openid email profile aws.cognito.signin.user.admin') +
      '&redirect_uri=' +
      encodeURIComponent(redirectUri) +
      '&code_challenge=' +
      encodeURIComponent(code_challenge) +
      '&code_challenge_method=S256' +
      (identityProviderName
        ? '&identity_provider=' + encodeURIComponent(identityProviderName)
        : '')
  }

  async handleAuthentication(): Promise<void> {
    const loginDomain = this.loginDomain
    const redirectUri = this.redirectUri
    if (!loginDomain || !redirectUri) {
      throw new TypeError(
        '"loginDomain" or "redirectUri" was not passed to constructor. Both are required before attempting to handle a login.',
      )
    }

    const query = new URLSearchParams(window.location.search)
    const queryError = query.get('error')
    const queryErrorDescription = query.get('error_description')

    // Check if the server returned an error string
    if (typeof queryError === 'string') {
      throw new Error(
        `${queryError} - ${
          typeof queryErrorDescription === 'string'
            ? queryErrorDescription
            : 'An unknown error has occurred.'
        }`,
      )
    }

    const code = query.get('code')
    if (typeof code !== 'string') {
      throw new Error('"code" was not including in query string to parse')
    }

    if (localStorage.getItem(this.STATE) !== query.get('state')) {
      throw new Error('Invalid login')
    }

    const code_verifier = localStorage.getItem(this.PKCE_CODE_VERIFIER)

    // Clean these up since we don't need them anymore
    localStorage.removeItem(this.STATE)
    localStorage.removeItem(this.PKCE_CODE_VERIFIER)

    // Exchange the authorization code for an access token
    const result: Record<string, unknown> = await new Promise(
      (resolve, reject) => {
        sendPostRequest(
          `https://${loginDomain}/oauth2/token`,
          {
            grant_type: 'authorization_code',
            code,
            client_id: this.clientId,
            redirect_uri: redirectUri,
            code_verifier,
          },
          resolve,
          (error) => {
            reject(
              new Error(
                error.error_description ||
                  error.message ||
                  'An unknown error has occurred while processing authentication code',
              ),
            )
          },
        )
      },
    )

    this._storeAuthenticationResult({
      AccessToken: result.access_token as string,
      ExpiresIn: result.expires_in as number,
      IdToken: result.id_token as string,
      TokenType: result.token_type as string,
      RefreshToken: result.refresh_token as string,
    })
  }

  async changePassword(
    existingPassword: string,
    newPassword: string,
  ): Promise<void> {
    const accessToken = await this.getAccessToken()
    await this.cognitoIdentityProviderClient.send(
      new ChangePasswordCommand({
        AccessToken: accessToken || '',
        PreviousPassword: existingPassword,
        ProposedPassword: newPassword,
      }),
    )
  }
  async confirmForgotPassword({
    username,
    code,
    password,
  }: {
    username: string
    code: string
    password: string
  }) {
    await this.cognitoIdentityProviderClient.send(
      new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        ConfirmationCode: code,
        Password: password,
        Username: username,
      }),
    )
  }

  logoutHostedUI(): void {
    const loginDomain = this.loginDomain
    const logoutUri = this.logoutUri
    if (!loginDomain || !logoutUri) {
      throw new TypeError(
        '"loginDomain" or "logoutUri" was not passed to constructor. Both are required before attempting to logout.',
      )
    }

    window.location.href =
      `https://${loginDomain}/logout` +
      '?client_id=' +
      encodeURIComponent(this.clientId) +
      '&logout_uri=' +
      encodeURIComponent(logoutUri)
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this._getRefreshToken()
      // Refresh session to allow access token to perform sign out
      if (refreshToken) {
        await this._refreshSession()
      }

      const accessToken = this._getAccessToken()
      if (accessToken) {
        await this.cognitoIdentityProviderClient.send(
          new GlobalSignOutCommand({
            AccessToken: accessToken,
          }),
        )
      }
    } catch (error) {
      if (!(error as OneBlinkAppsError).requiresLogin) {
        throw error
      }
    } finally {
      this._removeAuthenticationResult()
    }
  }

  async getIdToken(): Promise<string | undefined> {
    await this._refreshSession()

    return this._getIdToken()
  }

  async getAccessToken(): Promise<string | undefined> {
    await this._refreshSession()

    return this._getAccessToken()
  }

  async checkIsMfaEnabled() {
    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      return false
    }

    const user = await this.cognitoIdentityProviderClient.send(
      new GetUserCommand({
        AccessToken: accessToken,
      }),
    )

    return !!user.UserMFASettingList?.length
  }

  async disableMfa() {
    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      return
    }

    await this.cognitoIdentityProviderClient.send(
      new SetUserMFAPreferenceCommand({
        SoftwareTokenMfaSettings: {
          Enabled: false,
          PreferredMfa: false,
        },
        AccessToken: accessToken,
      }),
    )
  }

  async setupMfa() {
    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      return
    }

    const { SecretCode } = await this.cognitoIdentityProviderClient.send(
      new AssociateSoftwareTokenCommand({
        AccessToken: accessToken,
      }),
    )

    return {
      secretCode: SecretCode,
      mfaCodeCallback: async (code: string) => {
        await this.cognitoIdentityProviderClient.send(
          new VerifySoftwareTokenCommand({
            AccessToken: accessToken,
            UserCode: code,
          }),
        )
        await this.cognitoIdentityProviderClient.send(
          new SetUserMFAPreferenceCommand({
            SoftwareTokenMfaSettings: {
              Enabled: true,
              PreferredMfa: true,
            },
            AccessToken: accessToken,
          }),
        )
      },
    }
  }
}

//////////////////////////////////////////////////////////////////////
// GENERAL HELPER FUNCTIONS

// Make a POST request and parse the response as JSON
function sendPostRequest(
  url: string,
  params: Record<string, unknown>,
  success: (value: Record<string, unknown>) => void,
  error: (err: { message?: string; error_description?: string }) => void,
) {
  const request = new XMLHttpRequest()
  request.open('POST', url, true)
  request.setRequestHeader(
    'Content-Type',
    'application/x-www-form-urlencoded; charset=UTF-8',
  )
  request.onload = function () {
    let body = {}
    try {
      body = JSON.parse(request.response)
    } catch (e) {
      Sentry.captureException(e)
      // Do nothing
    }

    if (request.status == 200) {
      success(body)
    } else {
      error(body)
    }
  }
  request.onerror = function () {
    error({})
  }
  const body = Object.keys(params)
    .reduce((keys: string[], key) => {
      if (params[key]) {
        keys.push(key + '=' + params[key])
      }
      return keys
    }, [])
    .join('&')
  request.send(body)
}

//////////////////////////////////////////////////////////////////////
// PKCE HELPER FUNCTIONS

// Generate a secure random string using the browser crypto functions
function generateRandomString() {
  const array = new Uint32Array(28)
  window.crypto.getRandomValues(array)
  return Array.from(array, (dec) => ('0' + dec.toString(16)).substr(-2)).join(
    '',
  )
}

// Calculate the SHA256 hash of the input text.
// Returns a promise that resolves to an ArrayBuffer
function sha256(plain: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

// Base64-urlencodes the input string
function base64urlencode(str: ArrayBuffer) {
  // Convert the ArrayBuffer to string using Uint8 array to conver to what btoa accepts.
  // btoa accepts chars only within ascii 0-255 and base64 encodes them.
  // Then convert the base64 encoded to base64url encoded
  //   (replace + with -, replace / with _, trim trailing =)
  // @ts-expect-error
  return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Return the base64-urlencoded sha256 hash for the PKCE challenge
async function pkceChallengeFromVerifier(v: string) {
  const hashed = await sha256(v)
  return base64urlencode(hashed)
}
