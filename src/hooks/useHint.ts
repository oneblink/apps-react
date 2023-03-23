import * as React from 'react'
import sanitizeHtml from '../services/sanitize-html'
import { RepeatableSetIndexContext } from '../form-elements/FormElementRepeatableSet'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import { submissionService } from '@oneblink/sdk-core'
import { localisationService } from '@oneblink/apps'

const useHint = (elementHint: string | undefined) => {
  const { formSubmissionModel, elements } = useFormSubmissionModel()
  const index = React.useContext(RepeatableSetIndexContext)
  return React.useMemo(() => {
    if (!elementHint) return
    let html = elementHint
    html = html.replace('{INDEX}', (index + 1).toString())

    html = submissionService.replaceElementValues(html, {
      submission: formSubmissionModel,
      formElements: elements,
      formatCurrency: localisationService.formatCurrency,
      formatDate: (v) => localisationService.formatDate(new Date(v)),
      formatNumber: localisationService.formatNumber,
      formatTime: (v) => localisationService.formatTime(new Date(v)),
    })

    return sanitizeHtml(html)
  }, [elementHint, elements, formSubmissionModel, index])
}

export default useHint
