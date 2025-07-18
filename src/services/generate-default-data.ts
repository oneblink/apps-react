import { v4 as uuidv4 } from 'uuid'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { attachmentsService, localisationService } from '@oneblink/apps'
import { prepareNewAttachment } from './attachments'
import { dataUriToBlobSync } from './blob-utils'
import generateCivicaNameRecordElements from './generateCivicaNameRecordElements'

export const ENTRY_ID_PROPERTY_NAME = '$__id'
export const generateNewRepeatableSetEntry = () => ({
  [ENTRY_ID_PROPERTY_NAME]: uuidv4(),
})

function parseAttachment(
  value: unknown,
): attachmentsService.Attachment | undefined {
  return parseUnknownAsRecord(value, (record) => {
    // Check for attachments that have not been uploaded yet
    if (
      typeof record.type === 'string' &&
      typeof record._id === 'string' &&
      typeof record.fileName === 'string' &&
      typeof record.isPrivate === 'boolean'
    ) {
      return record as attachmentsService.Attachment
    }

    // Check for attachments that have been uploaded already
    if (
      typeof record.id === 'string' &&
      typeof record.fileName === 'string' &&
      typeof record.url === 'string' &&
      typeof record.contentType === 'string' &&
      typeof record.isPrivate === 'boolean' &&
      parseUnknownAsRecord(
        record.s3,
        (s3) =>
          typeof s3.bucket === 'string' &&
          typeof s3.key === 'string' &&
          typeof s3.region === 'string',
      )
    ) {
      return record as SubmissionTypes.FormSubmissionAttachment
    }
  })
}

function parseFile(
  element: FormTypes.FormElementBinaryStorage,
  value: unknown,
): attachmentsService.Attachment | undefined {
  return parseUnknownAsRecord(value, (record) => {
    if (
      record.type === undefined &&
      typeof record.fileName === 'string' &&
      typeof record.data === 'string'
    ) {
      const blob = dataUriToBlobSync(record.data)
      return prepareNewAttachment(blob, record.fileName, element)
    }

    return parseAttachment(record)
  })
}

function parseFiles(
  element: FormTypes.FormElementBinaryStorage,
  value: unknown,
): Array<attachmentsService.Attachment> | undefined {
  if (Array.isArray(value)) {
    const files = value.reduce<Array<attachmentsService.Attachment>>(
      (files, v) => {
        const file = parseFile(element, v)
        if (file) {
          files.push(file)
        }
        return files
      },
      [],
    )
    if (files.length) {
      return files
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

  const date = localisationService.generateDate({ daysOffset, value })
  if (!date) {
    return
  }

  if (dateOnly) {
    const { year, month, day } = new Intl.DateTimeFormat(
      localisationService.getLocale(),
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      },
    )
      .formatToParts(date)
      .reduce(
        (memo, { type, value }) => ({
          ...memo,
          [type]: value,
        }),
        {
          year: '',
          month: '',
          day: '',
        },
      )
    // This is a workaround for an iOS 15 bug where the year was being returned as 2 digits: https://bugs.webkit.org/show_bug.cgi?id=230827
    const fixedYear = year.length === 2 ? date.getFullYear() : year
    return `${fixedYear}-${month}-${day}`
  } else {
    return date.toISOString()
  }
}

function parseStringValue(value: unknown) {
  if (typeof value === 'string' && !!value) {
    return value
  }
  return
}

function parseNumberValue(value: unknown) {
  if (typeof value === 'number' && !isNaN(value)) {
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

function parseUnknownAsRecord<T>(
  value: unknown,
  validate: (value: Record<string, unknown>) => T | undefined,
): T | undefined {
  if (typeof value === 'object' && value !== null) {
    return validate(value as Record<string, unknown>)
  }
}

function parseUnknownAsArray<T>(
  value: unknown,
  validate: (value: unknown[]) => T[] | undefined,
): T[] | undefined {
  if (Array.isArray(value)) {
    return validate(value)
  }
}

function parseFormSubmissionModel(
  elements: FormTypes.FormElement[],
  value: unknown,
): SubmissionTypes.S3SubmissionData['submission'] | undefined {
  return parseUnknownAsRecord(value, (record) => {
    return elements.reduce<SubmissionTypes.S3SubmissionData['submission']>(
      (model, element) => {
        switch (element.type) {
          case 'section':
          case 'page': {
            const partialModel = parseFormSubmissionModel(
              element.elements,
              model,
            )
            Object.assign(model, partialModel)
            break
          }
          default: {
            model[element.name] = parsePreFillData(
              element,
              record[element.name],
            )
          }
        }

        return model
      },
      record,
    )
  })
}

function parsePreFillData(
  element: FormTypes.FormElement,
  value: unknown,
): unknown {
  switch (element.type) {
    // If a form element is pre-filled with the "legacy" storage type
    // format (base64), the data should be uploaded to S3 and set in the
    // submission data. This is to cater for instances of pre-fill data
    // being created before the "legacy" storage type was removed.
    case 'camera':
    case 'draw': {
      if (!value) {
        break
      } else if (typeof value === 'string') {
        const blob = dataUriToBlobSync(value)
        return prepareNewAttachment(blob, 'file', element)
      } else {
        return parseAttachment(value)
      }
    }
    case 'files': {
      return parseFiles(element, value)
    }
    case 'compliance': {
      return parseUnknownAsRecord(value, (record) => {
        const selectedValue = parseStringValue(record.value)
        const notes = parseStringValue(record.notes)
        if (selectedValue) {
          return {
            value: selectedValue,
            notes,
            files: parseFiles(element, record.files),
          }
        }
      })
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
    case 'bsb': {
      const text = parseStringValue(value)
      if (text?.match(/\d{3}-\d{3}/)) {
        return text
      }
      return
    }
    case 'text':
    case 'barcodeScanner':
    case 'email':
    case 'telephone':
    case 'textarea':
    case 'radio':
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
    case 'calculation':
    case 'number': {
      return parseNumberValue(value)
    }
    case 'boolean': {
      return typeof value === 'boolean' ? value : false
    }
    case 'abn': {
      return parseUnknownAsRecord(value, (record) => {
        const hasABN = parseUnknownAsRecord(record.ABN, (ABN) => {
          if (Array.isArray(ABN)) {
            return ABN.some((abn) => !!parseStringValue(abn.identifierValue))
          }
          if (parseStringValue(ABN.identifierValue)) {
            return true
          }
        })
        if (!hasABN) {
          return
        }
        return record
      })
    }
    case 'pointCadastralParcel': {
      return parseUnknownAsRecord(value, (record) => {
        const hasParcelId = parseUnknownAsRecord(
          record.parcelBundle,
          (parcelBundles) => {
            return parseUnknownAsRecord(parcelBundles?.[0], (parcelBundle) => {
              return parseStringValue(parcelBundle?.parcelId)
            })
          },
        )
        if (hasParcelId) {
          return record
        }
      })
    }
    case 'pointAddress':
    case 'geoscapeAddress': {
      return parseUnknownAsRecord(value, (record) => {
        if (parseStringValue(record.addressId)) {
          return record
        }
      })
    }
    case 'googleAddress': {
      return parseUnknownAsRecord(value, (record) => {
        if (parseStringValue(record.place_id)) {
          return record
        }
      })
    }
    case 'freshdeskDependentField': {
      return parseUnknownAsRecord(value, (record) => {
        if (
          parseStringValue(record.category) &&
          parseStringValue(record.subCategory) &&
          parseStringValue(record.item)
        ) {
          return record
        }
      })
    }
    case 'civicaNameRecord': {
      return parseUnknownAsRecord(value, (record) => {
        if (
          parseStringValue(record.title) &&
          parseStringValue(record.familyName) &&
          Array.isArray(record.streetAddress)
        ) {
          return record
        }
      })
    }
    case 'civicaStreetName': {
      return parseUnknownAsRecord(value, (record) => {
        if (
          parseStringValue(record.formattedAccount) &&
          parseStringValue(record.formattedStreet)
        ) {
          return record
        }
      })
    }
    case 'form': {
      return parseFormSubmissionModel(element.elements || [], value)
    }
    case 'repeatableSet': {
      if (Array.isArray(element.elements) && Array.isArray(value)) {
        return value.reduce((entries, v) => {
          const entry = parseFormSubmissionModel(
            element.elements,
            v
              ? {
                  ...generateNewRepeatableSetEntry(),
                  ...v,
                }
              : undefined,
          )
          if (entry) {
            entries.push(entry)
          }
          return entries
        }, [])
      }
      break
    }
    case 'location': {
      return parseUnknownAsRecord(value, (record) => {
        const latitude = parseNumberValue(record.latitude)
        const longitude = parseNumberValue(record.longitude)
        if (latitude !== undefined && longitude !== undefined) {
          return {
            latitude,
            longitude,
            zoom: parseNumberValue(record.zoom),
          }
        }
      })
    }
    case 'apiNSWLiquorLicence': {
      return parseUnknownAsRecord(value, (record) => {
        return parseUnknownAsRecord(record.licenceDetail, (licenceDetail) => {
          if (parseStringValue(licenceDetail.licenceNumber)) {
            return record
          }
        })
      })
    }
    case 'arcGISWebMap': {
      return parseUnknownAsRecord(value, (record) => {
        return {
          drawingLayer: parseUnknownAsArray(
            record.drawingLayer,
            (drawingLayer) => drawingLayer,
          ),
          userInput: parseUnknownAsArray(
            record.userInput,
            (userInput) => userInput,
          ),
          layers: parseUnknownAsArray(record.layers, (layers) => {
            if (
              layers.every((layer) =>
                parseUnknownAsRecord(
                  layer,
                  (layerRecord) =>
                    parseStringValue(layerRecord.title) &&
                    Array.isArray(layerRecord.graphics),
                ),
              )
            ) {
              return layers
            }
          }),
          view: parseUnknownAsRecord(record.view, (view) => {
            if (
              parseNumberValue(view.latitude) &&
              parseNumberValue(view.longitude) &&
              parseNumberValue(view.zoom)
            ) {
              return view
            }
          }),
        }
      })
    }
    case 'lookupButton':
    case 'image':
    case 'html':
    case 'summary':
    case 'captcha':
    case 'heading':
    case 'infoPage':
    case 'page':
    case 'section': {
      return
    }
    default: {
      const never: never = element
      console.warn('Invalid element type used in prefill data', never)
    }
  }
}

export default function generateDefaultData(
  elements: FormTypes.FormElement[],
  preFillData: SubmissionTypes.S3SubmissionData['submission'],
): SubmissionTypes.S3SubmissionData['submission'] {
  return elements.reduce<SubmissionTypes.S3SubmissionData['submission']>(
    (m, el) => {
      if (el.type !== 'page' && el.type !== 'section' && el.name in m) {
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
          m[el.name] = generateDefaultData(nestedElements, {
            ...el.defaultValue,
          })
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
            const entries = []
            for (let index = 0; index < minSetEntries; index++) {
              const entry = generateDefaultData(
                el.elements,
                generateNewRepeatableSetEntry(),
              )
              entries.push(entry)
            }
            m[el.name] = entries
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
        case 'camera':
        case 'draw':
        case 'files': {
          m[el.name] = parsePreFillData(el, el.defaultValue)
          break
        }
        case 'freshdeskDependentField':
        case 'geoscapeAddress':
        case 'pointCadastralParcel':
        case 'pointAddress':
        case 'googleAddress':
        case 'civicaStreetName':
        case 'abn':
        case 'bsb':
        case 'text':
        case 'barcodeScanner':
        case 'email':
        case 'telephone':
        case 'textarea':
        case 'location':
        case 'apiNSWLiquorLicence':
        case 'arcGISWebMap': {
          if (el.defaultValue) {
            m[el.name] = el.defaultValue
          }
          break
        }
        case 'boolean': {
          m[el.name] = el.defaultValue || false
          break
        }
        case 'lookupButton':
        case 'captcha':
        case 'heading':
        case 'html':
        case 'image':
        case 'infoPage':
        case 'calculation':
        case 'summary':
          break
        default: {
          const never: never = el
          console.warn('Default value is not supported for element type', never)
        }
      }

      return m
    },
    Object.assign({}, preFillData),
  )
}

const getOptionsDefaultValue = (el: FormTypes.FormElementWithOptions) => {
  if (!el.defaultValue) {
    return
  }
  // Cater for dynamic options
  if (el.optionsType === 'DYNAMIC' || el.optionsType === 'FRESHDESK_FIELD') {
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
