import * as React from 'react'
import { authService } from '@oneblink/apps'

type AppUserMfaState = {
  isLoading: boolean
  isMfaEnabled: boolean
  loadingError?: Error
  isSettingUpMfa: boolean
  isDisablingMfa: boolean
  setupError?: Error
  mfaSetup?: Awaited<ReturnType<typeof authService.setupMfa>>
}

export const AppUserMfaContext = React.createContext<
  AppUserMfaState & {
    beginMfaSetup: () => void
    cancelMfaSetup: () => void
    completeMfaSetup: () => void
    beginDisablingMfa: () => void
    cancelDisablingMfa: () => void
    completeDisablingMfa: () => void
    clearMfaSetupError: () => void
    loadAppUserMfa: () => void
  }
>({
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
  loadAppUserMfa: () => {},
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
 *   AppUserMfaProvider,
 *   useUserMeetsMfaRequirement,
 * } from '@oneblink/apps-react'
 *
 * function Component() {
 *   const { isLoading, userMeetsMfaRequirement } =
 *     useUserMeetsMfaRequirement(true)
 *   // use App User MFA Requirement details here
 * }
 *
 * function App() {
 *   return (
 *     <AppUserMfaProvider isExternalIdentityProviderUser={false}>
 *       <Component />
 *     </AppUserMfaProvider>
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
export function AppUserMfaProvider({
  children,
  isExternalIdentityProviderUser,
}: {
  children: React.ReactNode
  isExternalIdentityProviderUser: boolean
}) {
  const [state, setState] = React.useState<AppUserMfaState>({
    isLoading: !isExternalIdentityProviderUser,
    isMfaEnabled: false,
    isSettingUpMfa: false,
    isDisablingMfa: false,
  })

  const loadAppUserMfa = React.useCallback(
    async (abortSignal?: AbortSignal) => {
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
    },
    [],
  )

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

    loadAppUserMfa()

    return () => {}
  }, [isExternalIdentityProviderUser, loadAppUserMfa])

  const value = React.useMemo(() => {
    return {
      ...state,
      clearMfaSetupError,
      loadAppUserMfa,
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
    loadAppUserMfa,
    beginMfaSetup,
    cancelMfaSetup,
    completeMfaSetup,
    beginDisablingMfa,
    cancelDisablingMfa,
    completeDisablingMfa,
  ])

  return (
    <AppUserMfaContext.Provider value={value}>
      {children}
    </AppUserMfaContext.Provider>
  )
}

export default function useAppUserMfa() {
  return React.useContext(AppUserMfaContext)
}

/**
 * React hook to get the state associated to the logged in user's MFA status.
 * Will throw an Error if used outside of the `<AppUserMfaProvider />`
 * component.
 *
 * Example
 *
 * ```js
 * import { useUserMeetsMfaRequirement } from '@oneblink/apps-react'
 *
 * const isAppUserMfaRequired = true
 *
 * function Component() {
 *   const { isLoading, userMeetsMfaRequirement } =
 *     useUserMeetsMfaRequirement(isAppUserMfaRequired)
 * }
 * ```
 *
 * @returns
 * @group Hooks
 */
export function useUserMeetsMfaRequirement(isAppUserMfaRequired: boolean) {
  const context = React.useContext(AppUserMfaContext)

  if (!context) {
    throw new Error(
      `"useUserMeetsMfaRequirement" hook was used outside of the "<AppUserMfaProvider />" component's children.`,
    )
  }

  const { isLoading, loadingError, loadAppUserMfa, isMfaEnabled } = context

  if (!isAppUserMfaRequired) {
    return {
      isLoading: false,
      loadingError: undefined,
      userMeetsMfaRequirement: true,
      loadAppUserMfa,
    }
  }

  return {
    isLoading,
    loadingError,
    loadAppUserMfa,
    userMeetsMfaRequirement: isMfaEnabled,
  }
}
