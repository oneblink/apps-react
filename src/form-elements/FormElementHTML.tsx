import * as React from 'react'
import sanitizeHtml from '../services/sanitize-html'
import { FormTypes } from '@oneblink/types'
import { RepeatableSetIndexContext } from './FormElementRepeatableSet'
import useFormSubmissionModel from '../hooks/useFormSubmissionModelContext'
import { formElementsService, submissionService } from '@oneblink/sdk-core'
type Props = {
  element: FormTypes.HtmlElement
}

function FormElementHTML({ element }: Props) {
  const { formSubmissionModel } = useFormSubmissionModel()
  const index = React.useContext(RepeatableSetIndexContext)
  const html = React.useMemo(() => {
    let html = element.defaultValue
    html = html.replace('{INDEX}', (index + 1).toString())

    formElementsService.matchElementsTagRegex(html, (elementName) => {
      html = html.replace(
        `{ELEMENT:${elementName}}`,
        submissionService.getSubmissionValueAsString(
          elementName,
          formSubmissionModel,
        ),
      )
    })

    return sanitizeHtml(html)
  }, [element.defaultValue, formSubmissionModel, index])

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
