import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import useReplaceableHTML from '../hooks/useReplaceableHTML'
import QuillHTML from '../components/QuillHTML'

type Props = {
  element: FormTypes.HtmlElement
}

function FormElementHTML({ element }: Props) {
  const html = useReplaceableHTML(element.defaultValue)

  return (
    <div className="cypress-html-element">
      <div className="ob-form__element ob-information cypress-html-element">
        <QuillHTML
          html={html}
          className="cypress-html-element-content ob-information__content"
        />
      </div>
    </div>
  )
}

export default React.memo(FormElementHTML)
