import { localisationService, authService } from '@oneblink/apps'
import * as React from 'react'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import { useRepeatableSetIndexText } from '../form-elements/FormElementRepeatableSet'
import useTaskContext from './useTaskContext'

export default function useReplaceableText(text: string) {
  const textWithIndex = useRepeatableSetIndexText(text)
  const { formSubmissionModel, elements } = useFormSubmissionModel()
  const { task, taskGroup, taskGroupInstance } = useTaskContext()
  return React.useMemo(() => {
    return localisationService.replaceInjectablesWithElementValues(
      textWithIndex,
      {
        submission: formSubmissionModel,
        formElements: elements,
        userProfile: authService.getUserProfile() || undefined,
        task,
        taskGroup,
        taskGroupInstance,
      },
    )
  }, [
    elements,
    formSubmissionModel,
    task,
    taskGroup,
    taskGroupInstance,
    textWithIndex,
  ])
}
