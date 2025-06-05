import useReplaceInjectablesOverrides, {
  ReplaceInjectablesOverrides,
} from './useReplaceInjectablesOverrides'
import useAuth from './useAuth'
import { useMemo } from 'react'

const useUserProfileForInjectables = () => {
  const replaceInjectablesOverrides = useReplaceInjectablesOverrides()
  return useUserProfileForInjectablesOutsideContext(
    replaceInjectablesOverrides?.getUserProfile,
  )
}

export default useUserProfileForInjectables

export const useUserProfileForInjectablesOutsideContext = (
  overrideUserProfile: ReplaceInjectablesOverrides['getUserProfile'],
) => {
  const { userProfile } = useAuth()
  return useMemo(() => {
    if (overrideUserProfile) {
      return overrideUserProfile()
    }
    return userProfile ?? undefined
  }, [overrideUserProfile, userProfile])
}
