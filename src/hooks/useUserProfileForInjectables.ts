import useReplaceInjectablesOverrides, {
  ReplaceInjectablesOverrides,
} from './useReplaceInjectablesOverrides'
import useAuth from './useAuth'

const useUserProfileForInjectables = () => {
  const replaceInjectablesOverrides = useReplaceInjectablesOverrides()
  return useUserProfileForInjectablesOutsideContext(
    replaceInjectablesOverrides?.userProfile,
  )
}

export default useUserProfileForInjectables

export const useUserProfileForInjectablesOutsideContext = (
  overrideUserProfile: ReplaceInjectablesOverrides['userProfile'],
) => {
  const { userProfile } = useAuth()
  return overrideUserProfile ?? userProfile ?? undefined
}
