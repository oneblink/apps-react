import * as React from 'react'
import { mfaService } from '../apps'
import useLoadDataEffect from './useLoadDataEffect'
import { MiscTypes } from '@oneblink/types'

type MfaState = {
  isExternalIdentityProviderUser: boolean
  isLoading: boolean
  isMfaEnabled: boolean
  mfaSettings: mfaService.MfaSettings
  isSetupSuccessOpen: boolean
  loadingError?: Error
  isSettingUpMfa: boolean
  settingUpMfaMethod?: mfaService.MfaMethod
  isSetupMethodDialogOpen: boolean
  disablingMfaMethod?: mfaService.MfaMethod
  isSettingPreferredMfaMethod: boolean
  setupError?: Error
  mfaAuthenticatorAppSetup?: Awaited<
    ReturnType<typeof mfaService.setupMfaAuthenticatorApp>
  >
  isPhoneNumberDialogOpen: boolean
  phoneVerificationCodeSentAt?: number
  isRemovePhoneNumberDialogOpen: boolean
}

export const MfaContext = React.createContext<
  MfaState & {
    beginMfaSetup: (mfaMethod: mfaService.MfaMethod) => Promise<void>
    openMfaSetupMethodDialog: () => void
    closeMfaSetupMethodDialog: () => void
    beginDisablingMfaMethod: (mfaMethod: mfaService.MfaMethod) => void
    setPreferredMfaMethod: (mfaMethod: mfaService.MfaMethod) => Promise<void>
    openPhoneNumberDialog: () => void
    closePhoneNumberDialog: () => void
    savePhoneNumber: (phoneNumber: string) => Promise<void>
    verifyPhoneNumber: (code: string) => Promise<void>
    beginRemovingPhoneNumber: () => void
    cancelRemovingPhoneNumber: () => void
    completeRemovingPhoneNumber: () => Promise<void>
    hideSetupSuccess: () => void
    cancelMfaAuthenticatorAppSetup: () => void
    completeMfaAuthenticatorAppSetup: () => Promise<void>
    cancelDisablingMfa: () => void
    completeDisablingMfa: () => Promise<void>
    clearMfaSetupError: () => void
    loadMfa: () => void
  }
>({
  isExternalIdentityProviderUser: false,
  isLoading: true,
  isMfaEnabled: false,
  mfaSettings: mfaService.DEFAULT_MFA_SETTINGS,
  isSetupSuccessOpen: false,
  isSettingUpMfa: false,
  isSetupMethodDialogOpen: false,
  isSettingPreferredMfaMethod: false,
  isPhoneNumberDialogOpen: false,
  isRemovePhoneNumberDialogOpen: false,
  beginMfaSetup: async () => {},
  openMfaSetupMethodDialog: () => {},
  closeMfaSetupMethodDialog: () => {},
  beginDisablingMfaMethod: () => {},
  setPreferredMfaMethod: async () => {},
  openPhoneNumberDialog: () => {},
  closePhoneNumberDialog: () => {},
  savePhoneNumber: async () => {},
  verifyPhoneNumber: async () => {},
  beginRemovingPhoneNumber: () => {},
  cancelRemovingPhoneNumber: () => {},
  completeRemovingPhoneNumber: async () => {},
  hideSetupSuccess: () => {},
  cancelMfaAuthenticatorAppSetup: () => {},
  completeMfaAuthenticatorAppSetup: async () => {},
  cancelDisablingMfa: () => {},
  completeDisablingMfa: async () => {},
  clearMfaSetupError: () => {},
  loadMfa: () => {},
})

function getIsMfaEnabled(mfaSettings: mfaService.MfaSettings) {
  return mfaSettings.authenticator.enabled || mfaSettings.sms.enabled
}

function hasPreferredMfaMethod(mfaSettings: mfaService.MfaSettings) {
  return (
    (mfaSettings.authenticator.enabled &&
      mfaSettings.authenticator.preferred) ||
    (mfaSettings.sms.enabled && mfaSettings.sms.preferred)
  )
}

function enableSmsMfaInSettings(
  mfaSettings: mfaService.MfaSettings,
  smsPreferred: boolean,
): mfaService.MfaSettings {
  return {
    ...mfaSettings,
    sms: {
      ...mfaSettings.sms,
      enabled: true,
      preferred: smsPreferred,
    },
  }
}

function enableAuthenticatorMfaInSettings(
  mfaSettings: mfaService.MfaSettings,
  authenticatorPreferred: boolean,
): mfaService.MfaSettings {
  return {
    ...mfaSettings,
    authenticator: {
      enabled: true,
      preferred: authenticatorPreferred,
    },
    sms: {
      ...mfaSettings.sms,
      preferred: authenticatorPreferred ? false : mfaSettings.sms.preferred,
    },
  }
}

function setPreferredMfaMethodInSettings(
  mfaSettings: mfaService.MfaSettings,
  mfaMethod: mfaService.MfaMethod,
): mfaService.MfaSettings {
  return {
    ...mfaSettings,
    authenticator: {
      ...mfaSettings.authenticator,
      preferred: mfaMethod === 'authenticator',
    },
    sms: {
      ...mfaSettings.sms,
      preferred: mfaMethod === 'sms',
    },
  }
}

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
 * function Component({ teamMemberMfaRequirement }) {
 *   const { mfaSetupRequired, isLoading, loadingError, refreshMfa } =
 *     useUserMeetsMfaRequirement(teamMemberMfaRequirement)
 *
 *   if (isLoading) {
 *     return <Loading />
 *   }
 *
 *   if (loadingError) {
 *     return <Error onRetry={refreshMfa} />
 *   }
 *
 *   if (mfaSetupRequired) {
 *     return <ConfigureMfa />
 *   }
 *
 *   return <Application />
 * }
 *
 * function App({ teamMemberMfaRequirement }) {
 *   return (
 *     <MfaProvider isExternalIdentityProviderUser={false}>
 *       <Component teamMemberMfaRequirement={teamMemberMfaRequirement} />
 *     </MfaProvider>
 *   )
 * }
 *
 * const root = document.getElementById('root')
 * if (root) {
 *   ReactDOM.render(<App teamMemberMfaRequirement={mfaRequirement} />, root)
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
    mfaSettings: mfaService.DEFAULT_MFA_SETTINGS,
    isSetupSuccessOpen: false,
    isSettingUpMfa: false,
    isSetupMethodDialogOpen: false,
    isSettingPreferredMfaMethod: false,
    isPhoneNumberDialogOpen: false,
    isRemovePhoneNumberDialogOpen: false,
  })

  const handleLoadMfa = React.useCallback(
    async (abortSignal: AbortSignal) => {
      if (isExternalIdentityProviderUser) {
        return
      }

      setState((currentState) => ({
        ...currentState,
        isLoading: true,
        isMfaEnabled: false,
        mfaSettings: mfaService.DEFAULT_MFA_SETTINGS,
        loadingError: undefined,
      }))
      try {
        const mfaSettings = await mfaService.getMfaSettings(abortSignal)
        if (!abortSignal.aborted) {
          setState((currentState) => ({
            ...currentState,
            isLoading: false,
            mfaSettings,
            isMfaEnabled: getIsMfaEnabled(mfaSettings),
          }))
        }
      } catch (error) {
        if (abortSignal.aborted) {
          return
        }

        setState((currentState) => ({
          ...currentState,
          isLoading: false,
          loadingError: error as Error,
        }))
      }
    },
    [isExternalIdentityProviderUser],
  )

  const loadMfa = useLoadDataEffect(handleLoadMfa)

  const clearMfaSetupError = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      setupError: undefined,
    }))
  }, [])

  const openMfaSetupMethodDialog = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isSetupMethodDialogOpen: true,
    }))
  }, [])

  const closeMfaSetupMethodDialog = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isSetupMethodDialogOpen: false,
    }))
  }, [])

  const hideSetupSuccess = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isSetupSuccessOpen: false,
    }))
  }, [])

  const cancelMfaAuthenticatorAppSetup = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      mfaAuthenticatorAppSetup: undefined,
      settingUpMfaMethod: undefined,
    }))
  }, [])

  const completeMfaAuthenticatorAppSetup = React.useCallback(async () => {
    setState((currentState) => {
      const authenticatorPreferred = !hasPreferredMfaMethod(
        currentState.mfaSettings,
      )
      const mfaSettings = enableAuthenticatorMfaInSettings(
        currentState.mfaSettings,
        authenticatorPreferred,
      )

      return {
        ...currentState,
        isSetupSuccessOpen: true,
        isMfaEnabled: getIsMfaEnabled(mfaSettings),
        mfaSettings,
        mfaAuthenticatorAppSetup: undefined,
        settingUpMfaMethod: undefined,
      }
    })
  }, [])

  const openPhoneNumberDialog = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isPhoneNumberDialogOpen: true,
      phoneVerificationCodeSentAt: undefined,
      setupError: undefined,
    }))
  }, [])

  const closePhoneNumberDialog = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isPhoneNumberDialogOpen: false,
      phoneVerificationCodeSentAt: undefined,
    }))
  }, [])

  const setupSmsMfaMethod = React.useCallback(async () => {
    let smsPreferred = false

    setState((currentState) => {
      smsPreferred = !hasPreferredMfaMethod(currentState.mfaSettings)
      return currentState
    })

    await mfaService.setupSmsMfa({
      preferred: smsPreferred,
    })

    setState((currentState) => {
      const mfaSettings = enableSmsMfaInSettings(
        currentState.mfaSettings,
        smsPreferred,
      )

      return {
        ...currentState,
        isSetupSuccessOpen: true,
        isSettingUpMfa: false,
        settingUpMfaMethod: undefined,
        isMfaEnabled: getIsMfaEnabled(mfaSettings),
        mfaSettings,
      }
    })
  }, [])

  const savePhoneNumber = React.useCallback(
    async (phoneNumber: string) => {
      setState((currentState) => ({
        ...currentState,
        setupError: undefined,
      }))

      try {
        const { isPhoneNumberVerified } =
          await mfaService.updateUserPhoneNumber(phoneNumber)

        if (!isPhoneNumberVerified) {
          setState((currentState) => ({
            ...currentState,
            phoneVerificationCodeSentAt: Date.now(),
            mfaSettings: {
              ...currentState.mfaSettings,
              sms: {
                ...currentState.mfaSettings.sms,
                phoneNumber,
                isPhoneNumberVerified: false,
              },
            },
          }))
          return
        }
        setState((currentState) => ({
          ...currentState,
          mfaSettings: {
            ...currentState.mfaSettings,
            sms: {
              ...currentState.mfaSettings.sms,
              phoneNumber,
              isPhoneNumberVerified,
            },
          },
          isPhoneNumberDialogOpen: false,
          phoneVerificationCodeSentAt: undefined,
        }))
        await setupSmsMfaMethod()
      } catch (error) {
        setState((currentState) => ({
          ...currentState,
          setupError: error as Error,
        }))
      }
    },
    [setupSmsMfaMethod],
  )

  const verifyPhoneNumber = React.useCallback(
    async (code: string) => {
      setState((currentState) => ({
        ...currentState,
        setupError: undefined,
      }))

      try {
        await mfaService.verifyUserPhoneNumber(code)

        setState((currentState) => ({
          ...currentState,
          mfaSettings: {
            ...currentState.mfaSettings,
            sms: {
              ...currentState.mfaSettings.sms,
              isPhoneNumberVerified: true,
            },
          },
          isPhoneNumberDialogOpen: false,
          phoneVerificationCodeSentAt: undefined,
        }))
        await setupSmsMfaMethod()
      } catch (error) {
        setState((currentState) => ({
          ...currentState,
          setupError: error as Error,
        }))
      }
    },
    [setupSmsMfaMethod],
  )

  const beginRemovingPhoneNumber = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isRemovePhoneNumberDialogOpen: true,
      setupError: undefined,
    }))
  }, [])

  const cancelRemovingPhoneNumber = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isRemovePhoneNumberDialogOpen: false,
    }))
  }, [])

  const completeRemovingPhoneNumber = React.useCallback(async () => {
    setState((currentState) => ({
      ...currentState,
      setupError: undefined,
    }))

    try {
      await mfaService.removeUserPhoneNumber()
      setState((currentState) => ({
        ...currentState,
        isRemovePhoneNumberDialogOpen: false,
        mfaSettings: {
          ...currentState.mfaSettings,
          sms: {
            ...currentState.mfaSettings.sms,
            phoneNumber: undefined,
            isPhoneNumberVerified: false,
          },
        },
      }))
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        setupError: error as Error,
      }))
    }
  }, [])

  const beginMfaSetup = React.useCallback(
    async (mfaMethod: mfaService.MfaMethod) => {
      setState((currentState) => ({
        ...currentState,
        isSettingUpMfa: true,
        settingUpMfaMethod: mfaMethod,
        mfaAuthenticatorAppSetup: undefined,
        setupError: undefined,
      }))

      try {
        let mfaSettings = mfaService.DEFAULT_MFA_SETTINGS

        setState((currentState) => {
          mfaSettings = currentState.mfaSettings
          return currentState
        })

        if (mfaMethod === 'sms') {
          if (
            !mfaSettings.sms.phoneNumber ||
            !mfaSettings.sms.isPhoneNumberVerified
          ) {
            setState((currentState) => ({
              ...currentState,
              isSettingUpMfa: false,
              settingUpMfaMethod: undefined,
              isSetupMethodDialogOpen: false,
              isPhoneNumberDialogOpen: true,
            }))
            return
          }

          await setupSmsMfaMethod()
          setState((currentState) => ({
            ...currentState,
            isSetupMethodDialogOpen: false,
          }))
          return
        }

        const hasPreferredMethod = hasPreferredMfaMethod(mfaSettings)
        const newMfaAuthenticatorAppSetup =
          await mfaService.setupMfaAuthenticatorApp({
            preferred: !hasPreferredMethod,
          })
        setState((currentState) => ({
          ...currentState,
          isSettingUpMfa: false,
          isSetupMethodDialogOpen: false,
          mfaAuthenticatorAppSetup: newMfaAuthenticatorAppSetup,
        }))
      } catch (error) {
        setState((currentState) => ({
          ...currentState,
          isSettingUpMfa: false,
          settingUpMfaMethod: undefined,
          setupError: error as Error,
        }))
      }
    },
    [setupSmsMfaMethod],
  )

  const disablingMfaMethodRef = React.useRef<mfaService.MfaMethod | undefined>(
    undefined,
  )

  const beginDisablingMfaMethod = React.useCallback(
    (mfaMethod: mfaService.MfaMethod) => {
      disablingMfaMethodRef.current = mfaMethod
      setState((currentState) => ({
        ...currentState,
        disablingMfaMethod: mfaMethod,
      }))
    },
    [],
  )

  const cancelDisablingMfa = React.useCallback(() => {
    disablingMfaMethodRef.current = undefined
    setState((currentState) => ({
      ...currentState,
      disablingMfaMethod: undefined,
    }))
  }, [])

  const completeDisablingMfa = React.useCallback(async () => {
    const disablingMfaMethod = disablingMfaMethodRef.current
    if (!disablingMfaMethod) {
      return
    }

    await mfaService.disableMfaMethod(disablingMfaMethod)
    const mfaSettings = await mfaService.getMfaSettings()
    disablingMfaMethodRef.current = undefined
    setState((currentState) => ({
      ...currentState,
      disablingMfaMethod: undefined,
      mfaSettings,
      isMfaEnabled: getIsMfaEnabled(mfaSettings),
    }))
  }, [])

  const setPreferredMfaMethod = React.useCallback(
    async (mfaMethod: mfaService.MfaMethod) => {
      setState((currentState) => ({
        ...currentState,
        isSettingPreferredMfaMethod: true,
        setupError: undefined,
      }))

      try {
        await mfaService.setPreferredMfaMethod(mfaMethod)
        setState((currentState) => ({
          ...currentState,
          isSettingPreferredMfaMethod: false,
          mfaSettings: setPreferredMfaMethodInSettings(
            currentState.mfaSettings,
            mfaMethod,
          ),
        }))
      } catch (error) {
        setState((currentState) => ({
          ...currentState,
          isSettingPreferredMfaMethod: false,
          setupError: error as Error,
        }))
      }
    },
    [],
  )

  const value = React.useMemo(() => {
    return {
      ...state,
      clearMfaSetupError,
      loadMfa,
      beginMfaSetup,
      openMfaSetupMethodDialog,
      closeMfaSetupMethodDialog,
      beginDisablingMfaMethod,
      setPreferredMfaMethod,
      openPhoneNumberDialog,
      closePhoneNumberDialog,
      savePhoneNumber,
      verifyPhoneNumber,
      beginRemovingPhoneNumber,
      cancelRemovingPhoneNumber,
      completeRemovingPhoneNumber,
      hideSetupSuccess,
      cancelMfaAuthenticatorAppSetup,
      completeMfaAuthenticatorAppSetup,
      cancelDisablingMfa,
      completeDisablingMfa,
    }
  }, [
    state,
    clearMfaSetupError,
    loadMfa,
    beginMfaSetup,
    openMfaSetupMethodDialog,
    closeMfaSetupMethodDialog,
    beginDisablingMfaMethod,
    setPreferredMfaMethod,
    openPhoneNumberDialog,
    closePhoneNumberDialog,
    savePhoneNumber,
    verifyPhoneNumber,
    beginRemovingPhoneNumber,
    cancelRemovingPhoneNumber,
    completeRemovingPhoneNumber,
    hideSetupSuccess,
    cancelMfaAuthenticatorAppSetup,
    completeMfaAuthenticatorAppSetup,
    cancelDisablingMfa,
    completeDisablingMfa,
  ])

  return <MfaContext.Provider value={value}>{children}</MfaContext.Provider>
}

export default function useMfa() {
  return React.useContext(MfaContext)
}

/**
 * React hook to determine whether the logged in user must set up MFA before
 * accessing your application. Reads MFA settings from the `<MfaProvider />`
 * context. Will throw an Error if used outside of `<MfaProvider />`.
 *
 * Users signed in via an external identity provider are not required to set up
 * MFA.
 *
 * #### Example
 *
 * ```js
 * import { MfaProvider, useUserMeetsMfaRequirement } from '@oneblink/apps-react'
 *
 * function Component({ teamMemberMfaRequirement }) {
 *   const { mfaSetupRequired, isLoading, loadingError, refreshMfa } =
 *     useUserMeetsMfaRequirement(teamMemberMfaRequirement)
 *
 *   if (isLoading) {
 *     return <Loading />
 *   }
 *
 *   if (loadingError) {
 *     return <Error onRetry={refreshMfa} />
 *   }
 *
 *   if (mfaSetupRequired) {
 *     return <ConfigureMfa />
 *   }
 *
 *   return <Application />
 * }
 * ```
 *
 * @param mfaRequirement - The MFA requirement to enforce, e.g. from your
 * organisation or app settings.
 * @returns Whether MFA setup is required, along with loading state from the MFA
 * provider.
 * @group Hooks
 */
export function useUserMeetsMfaRequirement(
  mfaRequirement: MiscTypes.MfaRequirement | undefined,
) {
  const {
    isLoading,
    loadingError,
    mfaSettings,
    loadMfa,
    isExternalIdentityProviderUser,
  } = useMfa()

  return React.useMemo(() => {
    const mfaRequired = mfaService.isMfaRequired(mfaRequirement)
    const shouldCheckMfa = mfaRequired && !isExternalIdentityProviderUser
    const meetsRequirement = mfaService.userMeetsMfaRequirement(
      mfaRequirement,
      mfaSettings,
    )
    const mfaSetupRequired =
      shouldCheckMfa && !isLoading && !loadingError && !meetsRequirement

    return {
      mfaSetupRequired,
      isLoading: shouldCheckMfa && isLoading,
      loadingError: shouldCheckMfa ? loadingError : undefined,
      refreshMfa: loadMfa,
    }
  }, [
    mfaRequirement,
    isExternalIdentityProviderUser,
    mfaSettings,
    isLoading,
    loadingError,
    loadMfa,
  ])
}
