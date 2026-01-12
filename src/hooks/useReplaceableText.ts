import { localisationService } from '../apps'
import { useMemo } from 'react'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import { useRepeatableSetIndexText } from '../form-elements/FormElementRepeatableSet'
import useTaskContext from './useTaskContext'
import useUserProfileForInjectables from './useUserProfileForInjectables'

export default function useReplaceableText(text: string) {
  const textWithIndex = useRepeatableSetIndexText(text)
  const { formSubmissionModel, elements } = useFormSubmissionModel()
  const { task, taskGroup, taskGroupInstance } = useTaskContext()

  const userProfile = useUserProfileForInjectables()

  return useMemo(() => {
    return localisationService.replaceInjectablesWithElementValues(
      textWithIndex,
      {
        submission: formSubmissionModel,
        formElements: elements,
        userProfile,
        task,
        taskGroup,
        taskGroupInstance,
      },
    ).text
  }, [
    elements,
    formSubmissionModel,
    task,
    taskGroup,
    taskGroupInstance,
    textWithIndex,
    userProfile,
  ])
}
