import { localisationService, authService } from '@oneblink/apps'
import { useMemo, useCallback } from 'react'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import { useRepeatableSetIndexText } from '../form-elements/FormElementRepeatableSet'
import useTaskContext from './useTaskContext'
import useReplaceInjectablesOverrides from './useReplaceInjectablesOverrides'

export default function useReplaceableText(text: string) {
  const replaceInjectablesOverrides = useReplaceInjectablesOverrides()
  const textWithIndex = useRepeatableSetIndexText(text)
  const { formSubmissionModel, elements } = useFormSubmissionModel()
  const { task, taskGroup, taskGroupInstance } = useTaskContext()

  const getUserProfile = useCallback(() => {
    if (replaceInjectablesOverrides?.getUserProfile) {
      return replaceInjectablesOverrides.getUserProfile()
    }
    return authService.getUserProfile()
  }, [replaceInjectablesOverrides])

  return useMemo(() => {
    return localisationService.replaceInjectablesWithElementValues(
      textWithIndex,
      {
        submission: formSubmissionModel,
        formElements: elements,
        userProfile: getUserProfile() || undefined,
        task,
        taskGroup,
        taskGroupInstance,
      },
    ).text
  }, [
    elements,
    formSubmissionModel,
    getUserProfile,
    task,
    taskGroup,
    taskGroupInstance,
    textWithIndex,
  ])
}
