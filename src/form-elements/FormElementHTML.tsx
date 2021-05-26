import * as React from 'react'
import sanitizeHtml from '../services/sanitize-html'
import { FormTypes } from '@oneblink/types'
import { RepeatableSetIndexContext } from './FormElementRepeatableSet'

type Props = {
  element: FormTypes.HtmlElement
}

function FormElementHTML({ element }: Props) {
  const index = React.useContext(RepeatableSetIndexContext)
  const html = React.useMemo(() => {
    return element.defaultValue.replace('{INDEX}', (index + 1).toString())
  }, [element.defaultValue, index])

  return (
    <div className="cypress-html-element">
      <div className="ob-form__element ob-information cypress-html-element">
        <div
          className="cypress-html-element-content ob-information__content ql-editor"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(html),
          }}
        />
      </div>
    </div>
  )
}

export default React.memo(FormElementHTML)
