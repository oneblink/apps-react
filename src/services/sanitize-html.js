// @flow
import sanitizeHtml from 'sanitize-html'

//$FlowFixMe
const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
  'u',
  'b',
  'span',
  'h1',
  'h2',
])

const allowedAttributes = allowedTags.reduce((attributesObject, tag) => {
  attributesObject[tag] = ['style', 'class']
  return attributesObject
}, {})

const sanitizeHtmlStandard = (html: string) => {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
  })
}
export { sanitizeHtml, allowedTags, allowedAttributes, sanitizeHtmlStandard }
