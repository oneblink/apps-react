import * as React from 'react'
import { authService } from '@oneblink/apps'

type AuthContextValue = {
  isLoggedIn: ReturnType<typeof authService.isLoggedIn>
  userProfile: ReturnType<typeof authService.getUserProfile>
  userFriendlyName: ReturnType<typeof authService.getUserFriendlyName>
  isUsingFormsKey: boolean
}

const AuthContext = React.createContext<AuthContextValue>({
  isLoggedIn: false,
  userProfile: null,
  userFriendlyName: null,
  isUsingFormsKey: false,
})

export function AuthContextProvider({
  children,
  formsKeyToken,
  userToken,
}: {
  children: React.ReactNode
  formsKeyToken?: string
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

export default function useAuth() {
  return React.useContext(AuthContext)
}
