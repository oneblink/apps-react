// @flow
'use strict'

import * as React from 'react'
import { authService } from '@oneblink/apps'

/* ::
type AuthContextValue = {
  isLoggedIn: $Call<typeof authService.isLoggedIn>,
  userProfile: $Call<typeof authService.getUserProfile>,
  userFriendlyName: $Call<typeof authService.getUserFriendlyName>,
  isUsingFormsKey: boolean,
}
*/

const AuthContext /* : React.Context<AuthContextValue> */ = React.createContext(
  {
    isLoggedIn: false,
    userProfile: null,
    userFriendlyName: null,
    isUsingFormsKey: false,
  },
)

export function AuthContextProvider(
  {
    children,
    formsKeyToken,
  } /* : {
  children: React.Node,
  formsKeyToken?: string,
} */,
) {
  const [value, setValue] = React.useState(() => {
    if (formsKeyToken) {
      authService.setFormsKeyToken(formsKeyToken)
    }
    return {
      isLoggedIn: authService.isLoggedIn(),
      userProfile: authService.getUserProfile(),
      userFriendlyName: authService.getUserFriendlyName(),
      isUsingFormsKey: !!formsKeyToken,
    }
  })

  React.useEffect(() => {
    if (formsKeyToken) {
      authService.setFormsKeyToken(formsKeyToken)
      setValue((currentValue) => ({
        ...currentValue,
        isUsingFormsKey: !!formsKeyToken,
      }))
    }
  }, [formsKeyToken])

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
