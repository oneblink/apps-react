import * as React from 'react'
import sanitizeHtml from '../services/sanitize-html'
import { FormTypes } from '@oneblink/types'
import { RepeatableSetIndexContext } from './FormElementRepeatableSet'
import useFormSubmissionModel from '../hooks/useFormSubmissionModelContext'
import Mustache from 'mustache'

type Props = {
  element: FormTypes.HtmlElement
}

function FormElementHTML({ element }: Props) {
  const { formSubmissionModel } = useFormSubmissionModel()
  const index = React.useContext(RepeatableSetIndexContext)
  const html = React.useMemo(() => {
    return sanitizeHtml(
      element.defaultValue.replace('{INDEX}', (index + 1).toString()),
    )
  }, [element.defaultValue, index])

  const mustacheRenderedHTML = React.useMemo(
    () => Mustache.render(html, formSubmissionModel),
    [formSubmissionModel, html],
  )
  return (
    <div className="cypress-html-element">
      <div className="ob-form__element ob-information cypress-html-element">
        <div
          className="cypress-html-element-content ob-information__content ql-editor"
          dangerouslySetInnerHTML={{
            __html: mustacheRenderedHTML,
          }}
        />
      </div>
    </div>
  )
}

export default React.memo(FormElementHTML)
