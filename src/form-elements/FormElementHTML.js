// @flow
'use strict'

import * as React from 'react'
import sanitizeHtml from 'sanitize-html'

// $FlowFixMe
const sanitizeHtmlDefaults = sanitizeHtml.defaults
sanitizeHtmlDefaults.allowedAttributes.span = ['class']

/* ::
type Props = {
  element: HtmlElement,
}
*/

function FormElementHTML({ element } /* : Props */) {
  const safeHtml = sanitizeHtml(element.defaultValue, {
    allowedTags: sanitizeHtmlDefaults.allowedTags.concat([
      'u',
      'b',
      'img',
      'span',
    ]),
  })
  return (
    <div className="cypress-html-element">
      <div className="ob-form__element ob-information cypress-html-element">
        <div
          className="cypress-html-element-content ob-information__content"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </div>
    </div>
  )
}

export default (React.memo(
  FormElementHTML,
) /*: React.AbstractComponent<Props> */)
