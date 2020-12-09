import sanitizeHtml from 'sanitize-html'

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
  'u',
  'b',
  'span',
  'h1',
  'h2',
  'img'
])

const allowedAttributes = allowedTags.reduce(
  (attributesObject: { [property: string]: string[] }, tag: string) => {
    attributesObject[tag] = ['style', 'class']

    return attributesObject
  },
  {},
)

allowedAttributes.img.push('src')

const sanitizeHtmlStandard = (html: string) => {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
  })
}
export default sanitizeHtmlStandard
