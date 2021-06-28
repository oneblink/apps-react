import { FormTypes } from '@oneblink/types'
import { checkIsUsingLegacyStorage, prepareNewAttachment } from './attachments'
import { dataUriToBlobSync } from './blob-utils'
import generateCivicaNameRecordElements from './generateCivicaNameRecordElements'

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

const generateDate = ({
  daysOffset,
  value,
}: {
  daysOffset: number | undefined
  value: string
}): Date | undefined => {
  if (value === 'NOW') {
    const date = new Date()
    if (daysOffset === undefined) {
      return date
    } else {
      date.setDate(date.getDate() + daysOffset)
      return date
    }
  } else {
    const timestamp = Date.parse(value)
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp)
    }
  }
}

export function parseDateValue({
  dateOnly,
  daysOffset,
  value,
}: {
  dateOnly: boolean
  daysOffset: number | undefined
  value: unknown
}): string | undefined {
  if (typeof value !== 'string') {
    return
  }

  const date = generateDate({ daysOffset, value })
  if (!date) {
    return
  }

  const isoDate = date.toISOString()
  if (dateOnly) {
    return isoDate.split('T')[0]
  } else {
    return isoDate
  }
}

function parseStringValue(value: unknown) {
  if (typeof value === 'string' && !!value) {
    return value
  }
  return
}

function parseStringArrayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((val) => typeof val === 'string')
  }
  return
}

function parsePreFillData(
  element: FormTypes.FormElement,
  value: unknown,
): unknown {
  switch (element.type) {
    // If a form element is pre-filled and the storage type is not "legacy"
    // but the pre-fill data is in the format for the “legacy” storage type
    // (base64), the data should be uploaded to S3 and set in the submission
    // data. The base64 data should not be uploaded with the submission.
    // This is to cater for instances of pre-fill data being created before
    // a form element is updated to “public” or “private”.
    case 'camera':
    case 'draw': {
      if (!checkIsUsingLegacyStorage(element) && typeof value === 'string') {
        const blob = dataUriToBlobSync(value)
        return prepareNewAttachment(blob, 'file', element)
      }
      break
    }
    case 'files': {
      if (!checkIsUsingLegacyStorage(element)) {
        return parseFiles(element, value)
      }
      break
    }
    case 'compliance': {
      if (
        !checkIsUsingLegacyStorage(element) &&
        value &&
        typeof value === 'object'
      ) {
        const files = (value as Record<string, unknown>)?.files
        return parseFiles(element, files)
      }
      break
    }
    case 'time':
    case 'datetime':
    case 'date': {
      return parseDateValue({
        dateOnly: element.type === 'date',
        daysOffset: undefined,
        value,
      })
    }
    case 'text':
    case 'barcodeScanner':
    case 'email':
    case 'telephone':
    case 'textarea':
    case 'radio':
    case 'image':
    case 'autocomplete': {
      return parseStringValue(value)
    }
    case 'select': {
      if (element.multi) {
        return parseStringArrayValue(value)
      } else {
        return parseStringValue(value)
      }
    }
    case 'checkboxes': {
      return parseStringArrayValue(value)
    }
    case 'number': {
      if (typeof value === 'number' && !isNaN(value)) {
        return value
      }
      return
    }
    case 'boolean': {
      return !!value
    }
    case 'summary':
    case 'captcha':
    case 'calculation':
    case 'heading': {
      return
    }

    case 'form':
    case 'infoPage': {
      if (typeof value === 'object' && !!value) {
        // @ts-expect-error type `{}` does not match type `Record<string, unknown>`
        return generateDefaultData(element.elements || [], value)
      }
      return
    }
    case 'repeatableSet': {
      if (Array.isArray(element.elements) && Array.isArray(value)) {
        return value
          .map((val) => {
            if (typeof value !== 'object' || !value) {
              return
            }
            return generateDefaultData(element.elements, val)
          })
          .filter((val) => !!val)
      }
      break
    }
    case 'location': {
      if (typeof value === 'object' && !!value) {
        const clonedValue = {
          ...value,
        } as Record<string, unknown>
        if (
          typeof clonedValue.latitude !== 'number' ||
          isNaN(clonedValue.latitude) ||
          typeof clonedValue.longitude !== 'number' ||
          isNaN(clonedValue.longitude)
        ) {
          return
        }

        return {
          latitude: clonedValue.latitude,
          longitude: clonedValue.longitude,
          zoom:
            typeof clonedValue.zoom === 'number' && !isNaN(clonedValue.zoom)
              ? clonedValue.zoom
              : undefined,
        }
      }
      return
    }
    default: {
      return value
    }
  }
}

export default function generateDefaultData(
  elements: FormTypes.FormElement[],
  preFillData: FormElementsCtrl['model'],
): FormElementsCtrl['model'] {
  return elements.reduce<FormElementsCtrl['model']>((m, el) => {
    if (
      el.type !== 'page' &&
      el.type !== 'section' &&
      m[el.name] !== undefined
    ) {
      m[el.name] = parsePreFillData(el, m[el.name])
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
        } else {
          m[el.name] = undefined
        }
        break
      }
      case 'section':
      case 'page': {
        if (Array.isArray(el.elements)) {
          Object.assign(m, generateDefaultData(el.elements, m))
        }
        break
      }
      case 'civicaNameRecord': {
        const nestedElements = generateCivicaNameRecordElements(el, [])
        m[el.name] = generateDefaultData(nestedElements, { ...el.defaultValue })
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
          m[el.name] = parseDateValue({
            dateOnly: el.type === 'date',
            daysOffset: el.defaultValueDaysOffset,
            value: el.defaultValue,
          })
        }
        break
      }
      case 'geoscapeAddress':
      case 'pointAddress':
      case 'civicaStreetName':
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
      case 'boolean': {
        m[el.name] = el.defaultValue || false
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
