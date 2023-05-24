import { localisationService } from '@oneblink/apps'
import * as React from 'react'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import { useRepeatableSetIndexText } from '../form-elements/FormElementRepeatableSet'

export default function useReplaceableText(text: string) {
  const textWithIndex = useRepeatableSetIndexText(text)
  const { formSubmissionModel, elements } = useFormSubmissionModel()
  return React.useMemo(() => {
    return localisationService.replaceInjectablesWithElementValues(
      textWithIndex,
      {
        submission: formSubmissionModel,
        formElements: elements,
      },
    )
  }, [elements, formSubmissionModel, textWithIndex])
}
