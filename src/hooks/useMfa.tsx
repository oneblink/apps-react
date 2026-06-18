import * as React from 'react'
import { authService } from '../apps'

type MfaState = {
  isExternalIdentityProviderUser: boolean
  isLoading: boolean
  isMfaEnabled: boolean
  mfaSettings?: authService.MfaSettings
  isSetupSuccessOpen: boolean
  loadingError?: Error
  isSettingUpMfa: boolean
  settingUpMfaMethod?: authService.MfaSetupMethod
  isSetupMethodDialogOpen: boolean
  disablingMfaMethod?: authService.MfaSetupMethod
  setupError?: Error
  mfaSetup?: Awaited<ReturnType<typeof authService.setupMfa>>
  isPhoneNumberDialogOpen: boolean
  pendingSmsSetup: boolean
  isPhoneVerificationRequired: boolean
  phoneVerificationCodeSentAt?: number
  isRemovePhoneNumberDialogOpen: boolean
}

export const MfaContext = React.createContext<
  MfaState & {
    beginMfaSetup: (mfaMethod: authService.MfaSetupMethod) => Promise<void>
    openMfaSetupMethodDialog: () => void
    closeMfaSetupMethodDialog: () => void
    beginDisablingMfaMethod: (mfaMethod: authService.MfaSetupMethod) => void
    setPreferredMfaMethod: (
      mfaMethod: authService.MfaSetupMethod,
    ) => Promise<void>
    openPhoneNumberDialog: (forSmsSetup?: boolean) => void
    closePhoneNumberDialog: () => void
    savePhoneNumber: (phoneNumber: string) => Promise<void>
    verifyPhoneNumber: (code: string) => Promise<void>
    resendPhoneNumberVerificationCode: () => Promise<void>
    beginRemovingPhoneNumber: () => void
    cancelRemovingPhoneNumber: () => void
    completeRemovingPhoneNumber: () => Promise<void>
    hideSetupSuccess: () => void
    cancelMfaSetup: () => void
    completeMfaSetup: () => Promise<void>
    cancelDisablingMfa: () => void
    completeDisablingMfa: () => Promise<void>
    clearMfaSetupError: () => void
    loadMfa: () => void
  }
>({
  isExternalIdentityProviderUser: false,
  isLoading: true,
  isMfaEnabled: false,
  isSetupSuccessOpen: false,
  isSettingUpMfa: false,
  isSetupMethodDialogOpen: false,
  isPhoneNumberDialogOpen: false,
  pendingSmsSetup: false,
  isPhoneVerificationRequired: false,
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
  cancelMfaSetup: () => {},
  completeMfaSetup: async () => {},
  cancelDisablingMfa: () => {},
  completeDisablingMfa: async () => {},
  clearMfaSetupError: () => {},
  loadMfa: () => {},
})

function getIsMfaEnabled(mfaSettings: authService.MfaSettings | undefined) {
  return !!(mfaSettings?.authenticator.enabled || mfaSettings?.sms.enabled)
}

async function resolveMfaSettingsAfterSmsSetup(
  smsPreferred: boolean,
): Promise<authService.MfaSettings> {
  const mfaSettings = await authService.getMfaSettings()

  if (mfaSettings.sms.enabled) {
    return mfaSettings
  }

  return {
    ...mfaSettings,
    sms: {
      enabled: true,
      preferred: smsPreferred,
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
    isSetupSuccessOpen: false,
    isSettingUpMfa: false,
    isSetupMethodDialogOpen: false,
    isPhoneNumberDialogOpen: false,
    pendingSmsSetup: false,
    isPhoneVerificationRequired: false,
    isRemovePhoneNumberDialogOpen: false,
  })

  const loadMfa = React.useCallback(async (abortSignal?: AbortSignal) => {
    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      isMfaEnabled: false,
      mfaSettings: undefined,
      loadingError: undefined,
    }))
    try {
      const mfaSettings = await authService.getMfaSettings()
      if (!abortSignal?.aborted) {
        setState((currentState) => ({
          ...currentState,
          isLoading: false,
          mfaSettings,
          isMfaEnabled: getIsMfaEnabled(mfaSettings),
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

  const cancelMfaSetup = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      mfaSetup: undefined,
      settingUpMfaMethod: undefined,
    }))
  }, [])

  const completeMfaSetup = React.useCallback(async () => {
    const mfaSettings = await authService.getMfaSettings()
    setState((currentState) => ({
      ...currentState,
      isSetupSuccessOpen: true,
      isMfaEnabled: getIsMfaEnabled(mfaSettings),
      mfaSettings,
      mfaSetup: undefined,
      settingUpMfaMethod: undefined,
    }))
  }, [])

  const openPhoneNumberDialog = React.useCallback((forSmsSetup = false) => {
    setState((currentState) => ({
      ...currentState,
      isPhoneNumberDialogOpen: true,
      pendingSmsSetup: forSmsSetup,
      isPhoneVerificationRequired: false,
      setupError: undefined,
    }))
  }, [])

  const closePhoneNumberDialog = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isPhoneNumberDialogOpen: false,
      pendingSmsSetup: false,
      isPhoneVerificationRequired: false,
      phoneVerificationCodeSentAt: undefined,
    }))
  }, [])

  const setupSmsMfaMethod = React.useCallback(
    async (mfaSettings?: authService.MfaSettings) => {
      const hasPreferredMethod =
        (mfaSettings?.authenticator.enabled &&
          mfaSettings.authenticator.preferred) ||
        (mfaSettings?.sms.enabled && mfaSettings.sms.preferred)
      const smsPreferred = !hasPreferredMethod

      await authService.setupSmsMfa({
        preferred: smsPreferred,
      })

      const updatedMfaSettings =
        await resolveMfaSettingsAfterSmsSetup(smsPreferred)

      setState((currentState) => ({
        ...currentState,
        isSetupSuccessOpen: true,
        isSettingUpMfa: false,
        settingUpMfaMethod: undefined,
        isMfaEnabled: getIsMfaEnabled(updatedMfaSettings),
        mfaSettings: updatedMfaSettings,
      }))
    },
    [],
  )

  const savePhoneNumber = React.useCallback(
    async (phoneNumber: string) => {
      setState((currentState) => ({
        ...currentState,
        setupError: undefined,
      }))

      try {
        await authService.updateUserPhoneNumber(phoneNumber)
        const mfaSettings = await authService.getMfaSettings()
        const savedPhoneNumber = mfaSettings.phoneNumber || phoneNumber
        const phoneNumberNeedsVerification =
          !!savedPhoneNumber && !mfaSettings.isPhoneNumberVerified

        if (phoneNumberNeedsVerification) {
          setState((currentState) => ({
            ...currentState,
            isPhoneVerificationRequired: true,
            phoneVerificationCodeSentAt: Date.now(),
            mfaSettings: {
              ...(currentState.mfaSettings || {
                authenticator: { enabled: false, preferred: false },
                sms: { enabled: false, preferred: false },
                isPhoneNumberVerified: false,
              }),
              phoneNumber: savedPhoneNumber,
              isPhoneNumberVerified: false,
            },
          }))
          return
        }
        let pendingSmsSetup = false

        setState((currentState) => {
          pendingSmsSetup = currentState.pendingSmsSetup
          return currentState
        })

        if (pendingSmsSetup) {
          await setupSmsMfaMethod(mfaSettings)
          setState((currentState) => ({
            ...currentState,
            isPhoneNumberDialogOpen: false,
            pendingSmsSetup: false,
            isPhoneVerificationRequired: false,
            phoneVerificationCodeSentAt: undefined,
          }))
        } else {
          setState((currentState) => ({
            ...currentState,
            mfaSettings,
            isPhoneNumberDialogOpen: false,
            pendingSmsSetup: false,
            isPhoneVerificationRequired: false,
            phoneVerificationCodeSentAt: undefined,
          }))
        }
      } catch (error) {
        setState((currentState) => ({
          ...currentState,
          setupError: error as Error,
        }))
        throw error
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
        const mfaSettings = await authService.getMfaSettings()
        let pendingSmsSetup = false

        setState((currentState) => {
          pendingSmsSetup = currentState.pendingSmsSetup
          return currentState
        })

        if (pendingSmsSetup) {
          await setupSmsMfaMethod(mfaSettings)
          setState((currentState) => ({
            ...currentState,
            isPhoneNumberDialogOpen: false,
            pendingSmsSetup: false,
            isPhoneVerificationRequired: false,
            phoneVerificationCodeSentAt: undefined,
          }))
          return
        }

        setState((currentState) => ({
          ...currentState,
          mfaSettings,
          isPhoneNumberDialogOpen: false,
          isPhoneVerificationRequired: false,
          pendingSmsSetup: false,
          phoneVerificationCodeSentAt: undefined,
        }))
      } catch (error) {
        setState((currentState) => ({
          ...currentState,
          setupError: error as Error,
        }))
        throw error
      }
    },
    [setupSmsMfaMethod],
  )

  const resendInFlightRef = React.useRef(false)

  const resendPhoneNumberVerificationCode = React.useCallback(async () => {
    if (resendInFlightRef.current) {
      return
    }

    resendInFlightRef.current = true
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
      throw error
    } finally {
      resendInFlightRef.current = false
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
    await authService.removeUserPhoneNumber()
    const mfaSettings = await authService.getMfaSettings()
    setState((currentState) => ({
      ...currentState,
      isRemovePhoneNumberDialogOpen: false,
      mfaSettings,
    }))
  }, [])

  const beginMfaSetup = React.useCallback(
    async (mfaMethod: authService.MfaSetupMethod) => {
      setState((currentState) => ({
        ...currentState,
        isSettingUpMfa: true,
        settingUpMfaMethod: mfaMethod,
        mfaSetup: undefined,
        setupError: undefined,
      }))

      try {
        const mfaSettings = await authService.getMfaSettings()
        const hasPreferredMethod =
          (mfaSettings.authenticator.enabled &&
            mfaSettings.authenticator.preferred) ||
          (mfaSettings.sms.enabled && mfaSettings.sms.preferred)

        if (mfaMethod === 'sms') {
          if (!mfaSettings.phoneNumber || !mfaSettings.isPhoneNumberVerified) {
            setState((currentState) => ({
              ...currentState,
              isSettingUpMfa: false,
              settingUpMfaMethod: undefined,
              isSetupMethodDialogOpen: false,
              isPhoneNumberDialogOpen: true,
              pendingSmsSetup: true,
              mfaSettings,
            }))
            return
          }

          await setupSmsMfaMethod(mfaSettings)
          setState((currentState) => ({
            ...currentState,
            isSetupMethodDialogOpen: false,
          }))
          return
        }

        const newMfaSetup = await authService.setupMfa({
          preferred: !hasPreferredMethod,
        })
        setState((currentState) => ({
          ...currentState,
          isSettingUpMfa: false,
          isSetupMethodDialogOpen: false,
          mfaSetup: newMfaSetup,
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

  const disablingMfaMethodRef = React.useRef<
    authService.MfaSetupMethod | undefined
  >(undefined)

  const beginDisablingMfaMethod = React.useCallback(
    (mfaMethod: authService.MfaSetupMethod) => {
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
    async (mfaMethod: authService.MfaSetupMethod) => {
      setState((currentState) => ({
        ...currentState,
        setupError: undefined,
      }))

      try {
        await authService.setPreferredMfaMethod(mfaMethod)
        const mfaSettings = await authService.getMfaSettings()
        setState((currentState) => ({
          ...currentState,
          mfaSettings,
        }))
      } catch (error) {
        setState((currentState) => ({
          ...currentState,
          setupError: error as Error,
        }))
      }
    },
    [],
  )

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
      cancelMfaSetup,
      completeMfaSetup,
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
    cancelMfaSetup,
    completeMfaSetup,
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
