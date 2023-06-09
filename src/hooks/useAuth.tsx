import * as React from 'react'
import { authService } from '@oneblink/apps'
import { UserProfile } from '@oneblink/types/typescript/misc'

export type AuthContextValue = {
  /** `true` if the current user is logged in */
  isLoggedIn: boolean
  /**
   * See
   * [auth-service.getUserProfile()](https://oneblink.github.io/apps/modules/authService.html#getUserProfile)
   */
  userProfile: UserProfile | null
  /**
   * See
   * [auth-service.getUserFriendlyName()](https://oneblink.github.io/apps/modules/authService.html#getUserFriendlyName)
   */
  userFriendlyName: string | undefined
  /**
   * `true` if [`<AuthContextProvider />`](#AuthContextProvider) was passed the
   * `formsKeyToken` prop
   */
  isUsingFormsKey: boolean
}

const AuthContext = React.createContext<AuthContextValue>({
  isLoggedIn: false,
  userProfile: null,
  userFriendlyName: undefined,
  isUsingFormsKey: false,
})
/**
 * `<AuthContextProvider />` is a React Component that provides the context for
 * the `useAuth()` hook to be used by components further down your component
 * tree. **It should only be included in your component tree once and ideally at
 * the root of the application.**
 *
 * #### Example
 *
 * ```jsx
 * import * as React from 'react'
 * import { AuthContextProvider, useAuth } from '@oneblink/apps-react'
 *
 * function Component() {
 *   const auth = useAuth()
 *   // use auth here
 * }
 *
 * function App() {
 *   return (
 *     <AuthContextProvider>
 *       <Component />
 *     </AuthContextProvider>
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
export function AuthContextProvider({
  children,
  formsKeyToken,
  userToken,
}: {
  /** Your application components */
  children: React.ReactNode
  /**
   * A Forms Key token being used to make requests to the OneBlink API on behalf
   * of the user
   */
  formsKeyToken?: string
  /**
   * An encrypted user token that will be used included in the submission on
   * behalf of the user
   */
  userToken?: string
}) {
  const [value, setValue] = React.useState(() => {
    authService.setFormsKeyToken(formsKeyToken)
    authService.setUserToken(userToken)
    return {
      isLoggedIn: authService.isLoggedIn(),
      userProfile: authService.getUserProfile(),
      userFriendlyName: authService.getUserFriendlyName(),
      isUsingFormsKey: !!formsKeyToken,
    }
  })

  React.useEffect(() => {
    authService.setFormsKeyToken(formsKeyToken)
    setValue((currentValue) => ({
      ...currentValue,
      isUsingFormsKey: !!formsKeyToken,
    }))
  }, [formsKeyToken])

  React.useEffect(() => {
    authService.setUserToken(userToken)
  }, [userToken])

  React.useEffect(() => {
    return authService.registerAuthListener(() =>
      setValue((current) => ({
        ...current,
        isLoggedIn: authService.isLoggedIn(),
        userProfile: authService.getUserProfile(),
        userFriendlyName: authService.getUserFriendlyName(),
      })),
    )
  }, [])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * A React hook for containing state associated the current user. **This hook
 * requires [`<AuthContextProvider />`](./AuthContextProvider.html) to be
 * present in your component tree.**
 *
 * Example
 *
 * ```js
 * import { useAuth } from '@oneblink/apps-react'
 *
 * function Component() {
 *   const { isLoggedIn, userProfile, userFriendlyName, isUsingFormsKey } =
 *     useAuth()
 * }
 * ```
 *
 * @returns
 * @group Hooks
 */
export default function useAuth() {
  return React.useContext(AuthContext)
}
