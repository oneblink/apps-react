import { FormTypes } from '@oneblink/types'

class ElementDOMId {
  elementDOMId: string
  constructor(
    params:
      | {
          element: FormTypes.FormElementWithName
          idPrefix: string
        }
      | string,
  ) {
    if (typeof params !== 'string') {
      this.elementDOMId = `${params.idPrefix}${params.element.name}`
    } else {
      this.elementDOMId = params
    }
  }

  get value() {
    return this.elementDOMId
  }
  get elementContainerDOMId() {
    return `element-container__${this.elementDOMId}`
  }

  get subFormDOMIdPrefix() {
    return `${this.elementDOMId}_`
  }

  repeatableSetEntryDOMIdPrefix = (entryKey: string) => {
    return `${this.elementDOMId}_entry-${entryKey}_`
  }
}

export default ElementDOMId
