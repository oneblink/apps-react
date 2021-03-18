import { FormTypes } from '@oneblink/types'

export default function generateDefaultData(
  elements: FormTypes.FormElement[],
  preFillData: FormElementsCtrl['model'],
): { [property: string]: unknown } {
  return elements.reduce((m, el: FormTypes.FormElement) => {
    if (el.type !== 'page' && preFillData[el.name]) {
      m[el.name] = preFillData[el.name]
      return m
    }

    switch (el.type) {
      case 'checkboxes':
      case 'select':
      case 'autocomplete':
      case 'radio':
      case 'compliance': {
        const dv = getOptionsDefaultValue(el)
        if (dv) {
          if (el.type === 'compliance') {
            m[el.name] = {
              value: dv,
            }
          } else {
            m[el.name] = dv
          }
        }
        break
      }
      case 'number': {
        if (typeof el.defaultValue === 'number') {
          m[el.name] = el.defaultValue
        } else if (el.isSlider) {
          m[el.name] = el.minNumber
        }
        break
      }
      case 'page': {
        if (Array.isArray(el.elements)) {
          Object.assign(m, generateDefaultData(el.elements, preFillData))
        }
        break
      }
      case 'form': {
        if (Array.isArray(el.elements)) {
          m[el.name] = generateDefaultData(el.elements, {})
        }
        break
      }
      case 'repeatableSet': {
        if (
          Array.isArray(el.elements) &&
          typeof el.minSetEntries === 'number'
        ) {
          const minSetEntries = el.minSetEntries
          // add min number of entries by default
          m[el.name] = []
          for (let index = 0; index < minSetEntries; index++) {
            const entry = generateDefaultData(el.elements, {})
            // @ts-expect-error ???
            m[el.name].push(entry)
          }
        }
        break
      }
      case 'date':
      case 'datetime':
      case 'time': {
        if (el.defaultValue) {
          if (el.defaultValue === 'NOW') {
            m[el.name] = new Date().toISOString()
          } else {
            m[el.name] = el.defaultValue
          }
        }
        break
      }
      case 'geoscapeAddress':
      case 'file':
      case 'files':
      case 'camera':
      case 'draw':
      case 'location':
      case 'text':
      case 'barcodeScanner':
      case 'email':
      case 'telephone':
      case 'textarea': {
        // @ts-expect-error ???
        if (el.defaultValue) {
          // @ts-expect-error ???
          m[el.name] = el.defaultValue
        }
        break
      }
      case 'captcha':
      case 'heading':
      case 'html':
      case 'image':
      case 'infoPage':
      case 'calculation':
      case 'summary':
        break
      default: {
        console.warn('Default value is not supported for element type', el)
      }
    }

    return m
  }, Object.assign({}, preFillData))
}

const getOptionsDefaultValue = (el: FormTypes.FormElementWithOptions) => {
  if (!el.defaultValue) {
    return
  }
  // Cater for dynamic options
  if (el.optionsType === 'DYNAMIC') {
    return el.defaultValue
  }
  // Cater for multi-select and checkboxes
  else if ((el.type === 'select' && el.multi) || el.type === 'checkboxes') {
    if (Array.isArray(el.defaultValue) && el.defaultValue.length) {
      return el.defaultValue.reduce((optionValues: string[], optionId) => {
        const option = (el.options || []).find(
          (option) => option.id === optionId,
        )
        if (option) {
          optionValues.push(option.value)
        }
        return optionValues
      }, [])
    }
  } else {
    const option = (el.options || []).find(
      (option) => option.id === el.defaultValue,
    )
    if (option) {
      return option.value
    }
  }
  return
}
