import * as React from 'react'
import { authService } from '../apps'
import useLoadDataEffect from './useLoadDataEffect'

type MfaState = {
  isExternalIdentityProviderUser: boolean
  isLoading: boolean
  isMfaEnabled: boolean
  mfaSettings: authService.MfaSettings
  isSetupSuccessOpen: boolean
  loadingError?: Error
  isSettingUpMfa: boolean
  settingUpMfaMethod?: authService.MfaMethod
  isSetupMethodDialogOpen: boolean
  disablingMfaMethod?: authService.MfaMethod
  isSettingPreferredMfaMethod: boolean
  setupError?: Error
  mfaAuthenticatorAppSetup?: Awaited<
    ReturnType<typeof authService.setupMfaAuthenticatorApp>
  >
  isPhoneNumberDialogOpen: boolean
  phoneVerificationCodeSentAt?: number
  isRemovePhoneNumberDialogOpen: boolean
}

export const MfaContext = React.createContext<
  MfaState & {
    beginMfaSetup: (mfaMethod: authService.MfaMethod) => Promise<void>
    openMfaSetupMethodDialog: () => void
    closeMfaSetupMethodDialog: () => void
    beginDisablingMfaMethod: (mfaMethod: authService.MfaMethod) => void
    setPreferredMfaMethod: (mfaMethod: authService.MfaMethod) => Promise<void>
    openPhoneNumberDialog: () => void
    closePhoneNumberDialog: () => void
    savePhoneNumber: (phoneNumber: string) => Promise<void>
    verifyPhoneNumber: (code: string) => Promise<void>
    resendPhoneNumberVerificationCode: () => Promise<void>
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
  mfaSettings: authService.DEFAULT_MFA_SETTINGS,
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
  resendPhoneNumberVerificationCode: async () => {},
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

function getIsMfaEnabled(mfaSettings: authService.MfaSettings) {
  return mfaSettings.authenticator.enabled || mfaSettings.sms.enabled
}

function hasPreferredMfaMethod(mfaSettings: authService.MfaSettings) {
  return (
    (mfaSettings.authenticator.enabled &&
      mfaSettings.authenticator.preferred) ||
    (mfaSettings.sms.enabled && mfaSettings.sms.preferred)
  )
}

function enableSmsMfaInSettings(
  mfaSettings: authService.MfaSettings,
  smsPreferred: boolean,
): authService.MfaSettings {
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
  mfaSettings: authService.MfaSettings,
  authenticatorPreferred: boolean,
): authService.MfaSettings {
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
  mfaSettings: authService.MfaSettings,
  mfaMethod: authService.MfaMethod,
): authService.MfaSettings {
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
    mfaSettings: authService.DEFAULT_MFA_SETTINGS,
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
        mfaSettings: authService.DEFAULT_MFA_SETTINGS,
        loadingError: undefined,
      }))
      try {
        const mfaSettings = await authService.getMfaSettings(abortSignal)
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

    await authService.setupSmsMfa({
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
          await authService.updateUserPhoneNumber(phoneNumber)

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
        await authService.verifyUserPhoneNumber(code)

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

  const resendPhoneNumberVerificationCode = React.useCallback(async () => {
    setState((currentState) => ({
      ...currentState,
      setupError: undefined,
      phoneVerificationCodeSentAt: Date.now(),
    }))

    try {
      await authService.sendPhoneNumberVerificationCode()
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        setupError: error as Error,
      }))
    }
  }, [])

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
      await authService.removeUserPhoneNumber()
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
    async (mfaMethod: authService.MfaMethod) => {
      setState((currentState) => ({
        ...currentState,
        isSettingUpMfa: true,
        settingUpMfaMethod: mfaMethod,
        mfaAuthenticatorAppSetup: undefined,
        setupError: undefined,
      }))

      try {
        let mfaSettings = authService.DEFAULT_MFA_SETTINGS

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
          await authService.setupMfaAuthenticatorApp({
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

  const disablingMfaMethodRef = React.useRef<authService.MfaMethod | undefined>(
    undefined,
  )

  const beginDisablingMfaMethod = React.useCallback(
    (mfaMethod: authService.MfaMethod) => {
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

    await authService.disableMfaMethod(disablingMfaMethod)
    const mfaSettings = await authService.getMfaSettings()
    disablingMfaMethodRef.current = undefined
    setState((currentState) => ({
      ...currentState,
      disablingMfaMethod: undefined,
      mfaSettings,
      isMfaEnabled: getIsMfaEnabled(mfaSettings),
    }))
  }, [])

  const setPreferredMfaMethod = React.useCallback(
    async (mfaMethod: authService.MfaMethod) => {
      setState((currentState) => ({
        ...currentState,
        isSettingPreferredMfaMethod: true,
        setupError: undefined,
      }))

      try {
        await authService.setPreferredMfaMethod(mfaMethod)
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
      resendPhoneNumberVerificationCode,
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
    resendPhoneNumberVerificationCode,
    beginRemovingPhoneNumber,
    cancelRemovingPhoneNumber,
    completeRemovingPhoneNumber,
    hideSetupSuccess,
    cancelMfaAuthenticatorAppSetup,
    completeMfaAuthenticatorAppSetup,
    cancelDisablingMfa,
    completeDisablingMfa,
  ])

  return (
    <MfaContext.Provider value={value}>
      {children}
    </MfaContext.Provider>
  )
}

export default function useMfa() {
  return React.useContext(MfaContext)
}

/**
 * React hook to check if the logged in user meets the MFA requirement of your
 * application. Will throw an Error if used outside of the
 * `<MfaProvider />` component.
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
