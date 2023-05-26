import * as React from 'react'
import { authService, Sentry } from '@oneblink/apps'
import { FormsAppUser } from '@oneblink/types/typescript/formsApps'

export default function useSignUp({
  formsAppId,
  username,
  firstName,
  lastName,
}: {
  formsAppId: number
  username: string
  firstName?: string
  lastName?: string
}) {
  const usernameValidation = React.useMemo(() => {
    // regex source: https://www.w3resource.com/javascript/form/email-validation.php#:~:text=To%20get%20a%20valid%20email,%5D%2B)*%24%2F.
    return {
      isInvalid: !!username.match(
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/g,
      ),
    }
  }, [username])

  const [{ isSigningUp, signUpError, newFormsAppUser }, setSignUpState] =
    React.useState<{
      isSigningUp: boolean
      signUpError: Error | null
      newFormsAppUser: FormsAppUser | undefined
    }>({
      isSigningUp: false,
      signUpError: null,
      newFormsAppUser: undefined,
    })

  const clearSignUpError = React.useCallback(
    () =>
      setSignUpState((current) => ({
        ...current,
        signUpError: null,
      })),
    [],
  )

  const signUpWithUserDetails = React.useCallback(async () => {
    if (usernameValidation.isInvalid) {
      setSignUpState((current) => ({
        ...current,
        signUpError: new Error('Please enter a valid email address'),
      }))
      return
    }

    setSignUpState((currentState) => ({
      ...currentState,
      isSigningUp: true,
      signUpError: null,
    }))

    try {
      const newUser = await authService.signUp({
        formsAppId,
        email: username,
        firstName,
        lastName,
        generatePassword: true,
      })

      setSignUpState((currentState) => ({
        ...currentState,
        newFormsAppUser: newUser,
        isSigningUp: false,
      }))
    } catch (error) {
      Sentry.captureException(error)
      setSignUpState((currentState) => ({
        ...currentState,
        isSigningUp: false,
        signUpError: error as Error,
      }))
    }
  }, [firstName, formsAppId, lastName, username, usernameValidation.isInvalid])

  return {
    signUpWithUserDetails,
    clearSignUpError,
    isSigningUp,
    signUpError,
    newFormsAppUser,
  }
}
