import { FormTypes } from '@oneblink/types'

export default function flattenFormElements(
  elements: FormTypes.FormElement[],
): FormTypes.FormElement[] {
  return elements.reduce<FormTypes.FormElement[]>(
    (flattenedElements, element) => {
      switch (element.type) {
        case 'section':
        case 'page': {
          flattenedElements.push(
            element,
            ...flattenFormElements(element.elements),
          )
          break
        }
        case 'repeatableSet': {
          const flattenedChildren = flattenFormElements(element.elements)
          flattenedElements.push({
            ...element,
            elements: flattenedChildren,
          })
          break
        }
        default: {
          flattenedElements.push(element)
        }
      }
      return flattenedElements
    },
    [],
  )
}
