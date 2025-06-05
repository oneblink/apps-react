import { MiscTypes } from '@oneblink/types'
import { useContext } from 'react'
import { createContext } from 'react'

export type ReplaceInjectablesOverrides = {
  /**
   * The user profile. If not provided, the user profile will be that of the
   * currently logged in user. The user profile is used for any injectable
   * `{USER:}` values.
   */
  userProfile?: MiscTypes.UserProfile
}

export const ReplaceInjectablesOverridesContext = createContext<
  ReplaceInjectablesOverrides | undefined
>(undefined)

export default function useReplaceInjectablesOverrides() {
  return useContext(ReplaceInjectablesOverridesContext)
}
