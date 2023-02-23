import * as React from 'react'
import sanitizeHtml from '../services/sanitize-html'
import { FormTypes } from '@oneblink/types'
import { RepeatableSetIndexContext } from './FormElementRepeatableSet'
import useFormSubmissionModel from '../hooks/useFormSubmissionModelContext'
import matchElementsRegex from '../services/WYSIWYGRegexMatching'

type Props = {
  element: FormTypes.HtmlElement
}

function FormElementHTML({ element }: Props) {
  const { formSubmissionModel } = useFormSubmissionModel()
  const index = React.useContext(RepeatableSetIndexContext)
  const html = React.useMemo(() => {
    let html = element.defaultValue
    html = html.replace('{INDEX}', (index + 1).toString())

    matchElementsRegex(html, (elementName) => {
      const value = (): string => {
        const v = formSubmissionModel[elementName]
        switch (typeof v) {
          case 'function':
          case 'undefined':
          case 'symbol': {
            return ''
          }
          case 'object': {
            // Account for null
            return v?.toString() || ''
          }
          case 'number':
          case 'boolean':
          case 'bigint': {
            return v.toString()
          }
          default: {
            return v as string
          }
        }
      }
      html = html.replace(`{ELEMENT:${elementName}}`, value())
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
