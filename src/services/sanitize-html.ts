import sanitizeHtml from 'sanitize-html'

const allowedTags = [
  ...sanitizeHtml.defaults.allowedTags,
  'u',
  'span',
  'h1',
  'h2',
  'img',
]

const allowedAttributes = {
  ...sanitizeHtml.defaults.allowedAttributes,
  '*': ['style', 'class'],
}

const sanitizeHtmlStandard = (html: string) => {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
  })
}

export const sanitizeCustomCSS = (customCss: string) => {
  return sanitizeHtml(customCss, {
    allowedTags: [],
    allowedAttributes: {},
  })
}

export default sanitizeHtmlStandard
