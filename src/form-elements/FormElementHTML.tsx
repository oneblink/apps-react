import * as React from 'react'
import sanitizeHtml from '../services/sanitize-html'
import { FormTypes } from '@oneblink/types'

type Props = {
  element: FormTypes.HtmlElement
}

function FormElementHTML({ element }: Props) {
  return (
    <div className="cypress-html-element">
      <div className="ob-form__element ob-information cypress-html-element">
        <div
          className="cypress-html-element-content ob-information__content ql-editor"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(element.defaultValue),
          }}
        />
      </div>
    </div>
  )
}

export default React.memo(FormElementHTML)
