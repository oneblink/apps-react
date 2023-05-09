import { localisationService } from '@oneblink/apps'
import * as React from 'react'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import { useRepeatableSetIndexText } from '../form-elements/FormElementRepeatableSet'
import sanitizeHtml from '../services/sanitize-html'

export default function useReplaceableHTML(text: string) {
  const textWithIndex = useRepeatableSetIndexText(text)
  const html = React.useMemo(() => sanitizeHtml(textWithIndex), [textWithIndex])
  const { formSubmissionModel, elements } = useFormSubmissionModel()
  return React.useMemo(() => {
    return localisationService.replaceInjectablesWithElementValues(html, {
      submission: formSubmissionModel,
      formElements: elements,
    })
  }, [elements, formSubmissionModel, html])
}
