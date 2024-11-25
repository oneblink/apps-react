import * as React from 'react'
import { authService } from '@oneblink/apps'

type MfaState = {
  isExternalIdentityProviderUser: boolean
  isLoading: boolean
  isMfaEnabled: boolean
  loadingError?: Error
  isSettingUpMfa: boolean
  isDisablingMfa: boolean
  setupError?: Error
  mfaSetup?: Awaited<ReturnType<typeof authService.setupMfa>>
}

export const MfaContext = React.createContext<
  MfaState & {
    beginMfaSetup: () => void
    cancelMfaSetup: () => void
    completeMfaSetup: () => void
    beginDisablingMfa: () => void
    cancelDisablingMfa: () => void
    completeDisablingMfa: () => void
    clearMfaSetupError: () => void
    loadMfa: () => void
  }
>({
  isExternalIdentityProviderUser: false,
  isLoading: true,
  isMfaEnabled: false,
  isSettingUpMfa: false,
  isDisablingMfa: false,
  beginMfaSetup: () => {},
  cancelMfaSetup: () => {},
  completeMfaSetup: () => {},
  beginDisablingMfa: () => {},
  cancelDisablingMfa: () => {},
  completeDisablingMfa: () => {},
  clearMfaSetupError: () => {},
  loadMfa: () => {},
})

/**
 * React Component that provides the context for the
 * `useUserMeetsMfaRequirement()` hook and `<MultiFactorAuthentication />`
 * component, to be used by components further down your component tree. **It
 * should only be included in your component tree once and ideally at the root
 * of the application.**
 *
 * #### Example
 *
 * ```js
 * import * as React from 'react'
 * import {
 *   MfaProvider,
 *   useUserMeetsMfaRequirement,
 * } from '@oneblink/apps-react'
 *
 * function Component() {
 *   const { isLoading, userMeetsMfaRequirement } =
 *     useUserMeetsMfaRequirement(true)
 *   // use MFA Requirement details here
 * }
 *
 * function App() {
 *   return (
 *     <MfaProvider isExternalIdentityProviderUser={false}>
 *       <Component />
 *     </MfaProvider>
 *   )
 * }
 *
 * const root = document.getElementById('root')
 * if (root) {
 *   ReactDOM.render(<App />, root)
 * }
 * ```
 *
 * @param props
 * @returns
 * @group Components
 */
export function MfaProvider({
  children,
  isExternalIdentityProviderUser,
}: {
  children: React.ReactNode
  isExternalIdentityProviderUser: boolean
}) {
  const [state, setState] = React.useState<MfaState>({
    isExternalIdentityProviderUser,
    isLoading: !isExternalIdentityProviderUser,
    isMfaEnabled: false,
    isSettingUpMfa: false,
    isDisablingMfa: false,
  })

  const loadMfa = React.useCallback(async (abortSignal?: AbortSignal) => {
    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      isMfaEnabled: false,
      loadingError: undefined,
    }))
    try {
      const newIsMfaEnabled = await authService.checkIsMfaEnabled()
      if (!abortSignal?.aborted) {
        setState((currentState) => ({
          ...currentState,
          isLoading: false,
          isMfaEnabled: newIsMfaEnabled,
        }))
      }
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        isLoading: false,
        loadingError: error as Error,
      }))
    }
  }, [])

  const clearMfaSetupError = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      setupError: undefined,
    }))
  }, [])

  const cancelMfaSetup = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      mfaSetup: undefined,
    }))
  }, [])

  const completeMfaSetup = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isMfaEnabled: true,
      mfaSetup: undefined,
    }))
  }, [])

  const beginMfaSetup = React.useCallback(async () => {
    setState((currentState) => ({
      ...currentState,
      isSettingUpMfa: true,
      mfaSetup: undefined,
      setupError: undefined,
    }))
    try {
      const newMfaSetup = await authService.setupMfa()
      setState((currentState) => ({
        ...currentState,
        isSettingUpMfa: false,
        mfaSetup: newMfaSetup,
      }))
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        isSettingUpMfa: false,
        setupError: error as Error,
      }))
    }
  }, [])

  const beginDisablingMfa = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isDisablingMfa: true,
    }))
  }, [])

  const cancelDisablingMfa = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isDisablingMfa: false,
    }))
  }, [])

  const completeDisablingMfa = React.useCallback(async () => {
    await authService.disableMfa()
    setState((currentState) => ({
      ...currentState,
      isDisablingMfa: false,
      isMfaEnabled: false,
    }))
  }, [])

  React.useEffect(() => {
    if (isExternalIdentityProviderUser) {
      return
    }

    loadMfa()

    return () => {}
  }, [isExternalIdentityProviderUser, loadMfa])

  const value = React.useMemo(() => {
    return {
      ...state,
      clearMfaSetupError,
      loadMfa,
      beginMfaSetup,
      cancelMfaSetup,
      completeMfaSetup,
      beginDisablingMfa,
      cancelDisablingMfa,
      completeDisablingMfa,
    }
  }, [
    state,
    clearMfaSetupError,
    loadMfa,
    beginMfaSetup,
    cancelMfaSetup,
    completeMfaSetup,
    beginDisablingMfa,
    cancelDisablingMfa,
    completeDisablingMfa,
  ])

  return <MfaContext.Provider value={value}>{children}</MfaContext.Provider>
}

export default function useMfa() {
  return React.useContext(MfaContext)
}

/**
 * React hook to check if the logged in user meets the MFA requirement of your
 * application. Will throw an Error if used outside of the `<MfaProvider />`
 * component.
 *
 * Example
 *
 * ```js
 * import { useUserMeetsMfaRequirement } from '@oneblink/apps-react'
 *
 * const isMfaRequired = true
 *
 * function Component() {
 *   const userMeetsMfaRequirement =
 *     useUserMeetsMfaRequirement(isMfaRequired)
 * }
 * ```
 *
 * @returns
 * @group Hooks
 */
export function useUserMeetsMfaRequirement(isMfaRequired: boolean) {
  const context = React.useContext(MfaContext)

  if (!context) {
    throw new Error(
      `"useUserMeetsMfaRequirement" hook was used outside of the "<MfaProvider />" component's children.`,
    )
  }

  const { isMfaEnabled, isExternalIdentityProviderUser } = context
  if (!isMfaRequired || isExternalIdentityProviderUser) {
    return true
  }
  return isMfaEnabled
}
