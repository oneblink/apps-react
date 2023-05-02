import { localisationService } from '@oneblink/apps'
import * as React from 'react'
import { generateDate } from '../services/generate-default-data'
import { submissionService } from '@oneblink/sdk-core'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import { useRepeatableSetIndexText } from '../form-elements/FormElementRepeatableSet'
import sanitizeHtml from 'sanitize-html'

export default function useReplaceableHTML(text: string) {
  const textWithIndex = useRepeatableSetIndexText(text)
  const html = React.useMemo(() => sanitizeHtml(textWithIndex), [textWithIndex])
  const { formSubmissionModel, elements } = useFormSubmissionModel()
  return React.useMemo(() => {
    return submissionService.replaceElementValues(html, {
      submission: formSubmissionModel,
      formElements: elements,
      formatCurrency: localisationService.formatCurrency,
      formatDate: (v) => {
        const date = generateDate({
          value: v,
          dateOnly: true,
          daysOffset: undefined,
        })
        if (date) {
          return localisationService.formatDate(date)
        }
        return ''
      },
      formatNumber: localisationService.formatNumber,
      formatTime: (v) => localisationService.formatTime(new Date(v)),
    })
  }, [elements, formSubmissionModel, html])
}
