import { FormTypes } from '@oneblink/types'
import { prepareNewAttachment } from './attachments'
import { dataUriToBlobSync } from './blob-utils'

function parseFiles(
  element: FormTypes.FormElementBinaryStorage,
  files: unknown,
): unknown[] | undefined {
  if (Array.isArray(files)) {
    return files?.map((file) => {
      if (
        file &&
        typeof file === 'object' &&
        typeof file.fileName === 'string' &&
        typeof file.data === 'string'
      ) {
        const blob = dataUriToBlobSync(file.data)
        return prepareNewAttachment(blob, file.fileName, element)
      }
      return file
    })
  }
}

function parsePreFillData(
  element: FormTypes.FormElement,
  value: unknown,
): unknown | undefined {
  switch (element.type) {
    // If a form element is pre-filled and the storage type is not "legacy"
    // but the pre-fill data is in the format for the “legacy” storage type
    // (base64), the data should be uploaded to S3 and set in the submission
    // data. The base64 data should not be uploaded with the submission.
    // This is to cater for instances of pre-fill data being created before
    // a form element is updated to “public” or “private”.
    case 'camera':
    case 'draw': {
      if (
        (element.storageType === 'private' ||
          element.storageType === 'public') &&
        typeof value === 'string'
      ) {
        const blob = dataUriToBlobSync(value)
        return prepareNewAttachment(blob, 'file', element)
      }
      break
    }
    case 'files': {
      if (
        element.storageType === 'private' ||
        element.storageType === 'public'
      ) {
        return parseFiles(element, value)
      }
      break
    }
    case 'compliance': {
      if (
        (element.storageType === 'private' ||
          element.storageType === 'public') &&
        value &&
        typeof value === 'object'
      ) {
        const files = (value as Record<string, unknown>)?.files
        return parseFiles(element, files)
      }
      break
    }
  }

  return value
}

export default function generateDefaultData(
  elements: FormTypes.FormElement[],
  preFillData: FormElementsCtrl['model'],
): FormElementsCtrl['model'] {
  return elements.reduce((m, el: FormTypes.FormElement) => {
    if (el.type !== 'page' && preFillData[el.name] !== undefined) {
      m[el.name] = parsePreFillData(el, preFillData[el.name])
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
          if (el.type === 'compliance' && typeof dv === 'string') {
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
      case 'pointAddress':
      case 'camera':
      case 'text':
      case 'barcodeScanner':
      case 'email':
      case 'telephone':
      case 'textarea':
      case 'file':
      case 'files':
      case 'draw':
      case 'location': {
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
