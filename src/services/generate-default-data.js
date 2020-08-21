// @flow
'use strict'

export default function generateDefaultData(
  elements /* : FormElement[] */,
  preFillData /* :  $PropertyType<FormElementsCtrl, 'model'> */,
) /* : { [key: string]: any } */ {
  return elements.reduce((m, el) => {
    if (el.type !== 'page' && preFillData[el.name]) {
      m[el.name] = preFillData[el.name]
      return m
    }

    switch (el.type) {
      case 'checkboxes':
      case 'select':
      case 'autocomplete':
      case 'radio': {
        if (!el.defaultValue) {
          break
        }
        // Cater for dynamic options
        if (el.optionsType === 'DYNAMIC') {
          m[el.name] = el.defaultValue
          break
        }
        // Cater for multi-select and checkboxes
        if ((el.type === 'select' && el.multi) || el.type === 'checkboxes') {
          if (Array.isArray(el.defaultValue) && el.defaultValue.length) {
            m[el.name] = el.defaultValue.reduce((optionValues, optionId) => {
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
            m[el.name] = option.value
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
        if (el.defaultValue) {
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
        console.warn('Default value is not supported for element type', el.type)
      }
    }

    return m
  }, Object.assign({}, preFillData))
}
