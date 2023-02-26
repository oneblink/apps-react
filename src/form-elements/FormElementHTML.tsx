import * as React from 'react'
import sanitizeHtml from '../services/sanitize-html'
import { FormTypes } from '@oneblink/types'
import { RepeatableSetIndexContext } from './FormElementRepeatableSet'
import useFormSubmissionModel from '../hooks/useFormSubmissionModelContext'
import { submissionService } from '@oneblink/sdk-core'
import { localisationService } from '@oneblink/apps'

type Props = {
  element: FormTypes.HtmlElement
}

function FormElementHTML({ element }: Props) {
  const { formSubmissionModel, elements } = useFormSubmissionModel()
  const index = React.useContext(RepeatableSetIndexContext)
  const html = React.useMemo(() => {
    let html = element.defaultValue
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
  }, [element.defaultValue, elements, formSubmissionModel, index])

  return (
    <div className="cypress-html-element">
      <div className="ob-form__element ob-information cypress-html-element">
        <div
          className="cypress-html-element-content ob-information__content ql-editor"
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      </div>
    </div>
  )
}

export default React.memo(FormElementHTML)
