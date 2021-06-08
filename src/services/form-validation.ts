import validate from 'validate.js'
import { localisationService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import { FormElementBinaryStorageValue } from '../types/attachments'
import { PossibleFileConfiguration } from '../form-elements/FormElementFiles'
import { Value as FormElementComplianceValue } from '../form-elements/FormElementCompliance'
import { checkIsUsingLegacyStorage } from './attachments'
import { parseDateValue } from './generate-default-data'

export const lookupValidationMessage = 'Lookup is required'
// https://validatejs.org/#validators-datetime
// Before using it we must add the parse and format functions
// Here is a sample implementation using moment.js
validate.extend(validate.validators.datetime, {
  // The value is guaranteed not to be null or undefined but otherwise it
  // could be anything.
  parse: function (value: string) {
    return Date.parse(value)
  },
  // Input is a unix timestamp
  format: function (
    value: string,
    options: { format: (date: Date) => string },
  ) {
    const dateValue = new Date(value)
    return options.format(dateValue)
  },
})

validate.validators.entries = function (
  value: unknown,
  {
    setSchema,
    entrySchema,
  }: { setSchema: ValidateJSSchema; entrySchema: ValidateJSSchema },
) {
  const entries = Array.isArray(value) ? value : []

  const entryErrors = entries.reduce((errorsByIndex, entry, index) => {
    const entryValidation = validateSingleMessageError(entry, entrySchema)
    if (entryValidation) {
      errorsByIndex[index] = entryValidation
    }
    return errorsByIndex
  }, {})

  const setErrorMessages = validate.single(value, setSchema)

  if (!setErrorMessages && validate.isEmpty(entryErrors)) {
    return
  }

  return {
    type: 'repeatableSet',
    set: setErrorMessages && setErrorMessages[0],
    entries: entryErrors,
  }
}

validate.validators.nestedElements = function (
  value: FormElementsCtrl['model'] | undefined,
  schema: ValidateJSSchema,
) {
  if (!value || typeof value !== 'object') return
  const errors = validateSingleMessageError(value, schema)
  if (!errors) {
    return
  }
  return {
    type: 'nestedForm',
    nested: errors,
  }
}

function getInvalidAttachment(value: FormElementBinaryStorageValue) {
  if (
    value &&
    typeof value === 'object' &&
    value.type &&
    value.type === 'ERROR'
  ) {
    return value
  }
}
function validateAttachments(
  value: FormElementBinaryStorageValue[] | undefined,
) {
  const invalidAttachmentNames = value?.reduce(
    (invalidAttachmentNames: string[], att) => {
      const attachmentName = getInvalidAttachment(att)?.fileName
      if (attachmentName) {
        invalidAttachmentNames.push(attachmentName)
      }
      return invalidAttachmentNames
    },
    [],
  )
  if (invalidAttachmentNames?.length) {
    return `${invalidAttachmentNames.join(', ')} could not be uploaded.`
  }
}
validate.validators.attachment = function (
  value: FormElementBinaryStorageValue,
) {
  return getInvalidAttachment(value)?.errorMessage
}
validate.validators.attachments = function (
  value:
    | FormElementBinaryStorageValue[]
    | FormElementComplianceValue
    | undefined,
) {
  if (Array.isArray(value)) {
    return validateAttachments(value)
  }
  return validateAttachments(
    value?.files as FormElementBinaryStorageValue[] | undefined,
  )
}

// Extend validator for lookups
validate.validators.lookups = function (
  value: unknown,
  {
    elementIdsWithLookupsExecuted,
    formElement,
  }: {
    formElement: FormTypes.LookupFormElement & FormTypes.FormElementRequired
    elementIdsWithLookupsExecuted: string[]
  },
) {
  if (!formElement.isDataLookup && !formElement.isElementLookup) {
    return
  }

  // Lookups must only be executed on required form elements
  if (formElement && !formElement.required) {
    return
  }

  if (elementIdsWithLookupsExecuted.includes(formElement.id)) {
    return
  }

  return lookupValidationMessage
}

validate.validators.numberRegex = function (value: unknown, format: unknown) {
  if (!format) {
    return
  }
  if (typeof value === 'number' && !Number.isNaN(value)) {
    value = value.toString()
  }
  const errorMessages = validate.single(value, { format })
  return errorMessages && errorMessages[0]
}

validate.validators.isTrue = function (value: unknown, message?: string) {
  if (!value) {
    return message || 'Must be set to true'
  }
}

function getCustomRegexFormatConfig<DefaultValue>(
  formElement: FormTypes.FormElementWithInput<DefaultValue>,
) {
  return formElement.regexPattern
    ? {
        pattern: formElement.regexPattern,
        flags: formElement.regexFlags,
        message: formElement.regexMessage,
      }
    : undefined
}

type ValidateJSSchema = Record<string, unknown>

type ValidateJSSchemaByPageId = {
  [pageElementId: string]: ValidateJSSchema
}

export function generateSchemasByPages(
  pages: FormTypes.PageElement[],
  elementIdsWithLookupsExecuted: string[],
): ValidateJSSchemaByPageId {
  return pages.reduce(
    (partialSchemaByPageId: ValidateJSSchemaByPageId, pageElement) => {
      partialSchemaByPageId[pageElement.id] = generateSchemaReducer(
        pageElement.elements,
        elementIdsWithLookupsExecuted,
      )
      return partialSchemaByPageId
    },
    {},
  )
}

export const validatePages = (
  schemaByPageId: ValidateJSSchemaByPageId,
  submission: FormElementsCtrl['model'],
  pageElementsConditionallyShown: PageElementsConditionallyShown,
): PageElementsValidation | undefined => {
  const pagesValidation = Object.keys(schemaByPageId).reduce(
    (partialMessagesByPageId: PageElementsValidation, pageId) => {
      const schema = schemaByPageId[pageId]
      const pageElementConditionallyShown =
        pageElementsConditionallyShown[pageId]

      if (
        !pageElementConditionallyShown ||
        pageElementConditionallyShown.isShown
      ) {
        const formElementsValidation = validateSingleMessageError(
          submission,
          schema,
        )
        if (formElementsValidation) {
          clearValidationMessagesForHiddenElements(
            formElementsValidation,
            pageElementConditionallyShown &&
              pageElementConditionallyShown.formElements,
          )
          if (!validate.isEmpty(formElementsValidation)) {
            partialMessagesByPageId[pageId] = formElementsValidation
          }
        }
      }

      return partialMessagesByPageId
    },
    {},
  )

  return validate.isEmpty(pagesValidation) ? undefined : pagesValidation
}

const clearValidationMessagesForHiddenElements = (
  formElementsValidation?: FormElementsValidation,
  formElementsConditionallyShown?: FormElementsConditionallyShown,
) => {
  // If there is no validation to check, there are no invalid elements
  // If there is no conditionally shown elements, all invalid elements should display validation messages,
  if (!formElementsValidation || !formElementsConditionallyShown) {
    return
  }

  for (const key in formElementsValidation) {
    const formElementValidation = formElementsValidation[key]
    if (!formElementValidation) {
      continue
    }

    const formElementConditionallyShown = formElementsConditionallyShown[key]
    const isShown =
      !formElementConditionallyShown || formElementConditionallyShown.isShown

    // If the validation is for an element that is being hidden,
    // we can remove the validation message and move to the next validation
    if (!isShown) {
      delete formElementsValidation[key]
      continue
    }

    // If the validation is for a single element (not nested elements),
    // we can will always show the validation message
    if (typeof formElementValidation === 'string') {
      continue
    }

    // Here we will check to see if the nested elements that are
    // invalid are being shown, if not, remove validation messages
    switch (formElementValidation.type) {
      case 'repeatableSet': {
        for (const index in formElementValidation.entries) {
          clearValidationMessagesForHiddenElements(
            formElementValidation.entries[index],
            formElementConditionallyShown &&
              formElementConditionallyShown.type === 'repeatableSet'
              ? formElementConditionallyShown.entries[index]
              : undefined,
          )
          if (validate.isEmpty(formElementValidation.entries[index])) {
            delete formElementValidation.entries[index]
          }
        }
        // Remove the validation if all entries are valid and the set is also valid
        if (
          validate.isEmpty(formElementValidation.entries) &&
          !formElementValidation.set
        ) {
          delete formElementsValidation[key]
        }
        break
      }
      case 'nestedForm': {
        clearValidationMessagesForHiddenElements(
          formElementValidation.nested,
          formElementConditionallyShown &&
            formElementConditionallyShown.type === 'nestedForm'
            ? formElementConditionallyShown.nested
            : undefined,
        )
        if (validate.isEmpty(formElementValidation.nested)) {
          delete formElementsValidation[key]
        }
        break
      }
    }
  }
}

const presence = (required: boolean, message: string) =>
  required ? { message } : false

const escapeElementName = (elementName: string) => {
  const escapedName = elementName.replace(/\./g, '\\.')
  return escapedName
}

const generateSchemaReducer = (
  formElements: FormTypes.FormElement[],
  elementIdsWithLookupsExecuted: string[],
): ValidateJSSchema => {
  return formElements.reduce((partialSchema: ValidateJSSchema, formElement) => {
    switch (formElement.type) {
      case 'summary':
      case 'calculation':
      case 'image':
      case 'html':
      case 'infoPage':
      case 'heading':
      case 'page': {
        break
      }
      case 'draw': {
        partialSchema[escapeElementName(formElement.name)] = {
          attachment: !checkIsUsingLegacyStorage(formElement),
          presence: presence(formElement.required, 'A signature is required'),
        }
        break
      }
      case 'camera': {
        partialSchema[escapeElementName(formElement.name)] = {
          attachment: !checkIsUsingLegacyStorage(formElement),
          presence: presence(formElement.required, 'A photo is required'),
        }
        break
      }
      case 'captcha': {
        partialSchema[escapeElementName(formElement.name)] = {
          presence: presence(true, 'Please complete the CAPTCHA successfully'),
        }
        break
      }
      case 'location': {
        partialSchema[escapeElementName(formElement.name)] = {
          presence: presence(formElement.required, 'Please select a location'),
          lookups: {
            formElement,
            elementIdsWithLookupsExecuted,
          },
        }
        break
      }
      case 'compliance': {
        partialSchema[escapeElementName(formElement.name)] = {
          presence: presence(formElement.required, 'Required'),
          lookups: {
            formElement,
            elementIdsWithLookupsExecuted,
          },
          attachments: !checkIsUsingLegacyStorage(formElement),
        }
        break
      }
      case 'geoscapeAddress':
      case 'pointAddress':
      case 'autocomplete':
      case 'checkboxes':
      case 'radio':
      case 'select': {
        partialSchema[escapeElementName(formElement.name)] = {
          presence: presence(formElement.required, 'Required'),
          lookups: {
            formElement,
            elementIdsWithLookupsExecuted,
          },
        }
        break
      }
      case 'boolean': {
        partialSchema[escapeElementName(formElement.name)] = {
          isTrue: formElement.required && 'Required',
          lookups: {
            formElement,
            elementIdsWithLookupsExecuted,
          },
        }
        break
      }
      case 'barcodeScanner': {
        partialSchema[escapeElementName(formElement.name)] = {
          presence: presence(
            formElement.required,
            'Please scan a barcode or enter a value',
          ),
          lookups: {
            formElement,
            elementIdsWithLookupsExecuted,
          },
          format: getCustomRegexFormatConfig(formElement),
        }
        break
      }
      case 'text':
      case 'textarea': {
        partialSchema[escapeElementName(formElement.name)] = {
          presence: presence(formElement.required, 'Please enter a value'),
          lookups: {
            formElement,
            elementIdsWithLookupsExecuted,
          },
          length: {
            minimum: formElement.minLength,
            tooShort:
              'Please enter a value with at least %{count} character(s)',
            maximum: formElement.maxLength,
            tooLong: 'Please enter a value with %{count} character(s) or less',
          },
          format: getCustomRegexFormatConfig(formElement),
        }
        break
      }
      case 'telephone': {
        partialSchema[escapeElementName(formElement.name)] = {
          presence: presence(
            formElement.required,
            'Please enter a phone number',
          ),
          lookups: {
            formElement,
            elementIdsWithLookupsExecuted,
          },
          format: getCustomRegexFormatConfig(formElement),
        }
        break
      }
      case 'email': {
        partialSchema[escapeElementName(formElement.name)] = {
          presence: presence(
            formElement.required,
            'Please enter an email address',
          ),
          email: {
            message: 'Please enter a valid email for this field',
          },
          lookups: {
            formElement,
            elementIdsWithLookupsExecuted,
          },
          format: getCustomRegexFormatConfig(formElement),
        }
        break
      }
      case 'time': {
        partialSchema[escapeElementName(formElement.name)] = {
          presence: presence(formElement.required, 'Please select a time'),
          lookups: {
            formElement,
            elementIdsWithLookupsExecuted,
          },
        }
        break
      }
      case 'date': {
        partialSchema[escapeElementName(formElement.name)] = {
          presence: presence(formElement.required, 'Please select a date'),
          date: {
            format: (v: Date) => localisationService.formatDate(v),
            earliest: parseDateValue({
              dateOnly: true,
              daysOffset: formElement.fromDateDaysOffset,
              value: formElement.fromDate,
            }),
            latest: parseDateValue({
              dateOnly: true,
              daysOffset: formElement.toDateDaysOffset,
              value: formElement.toDate,
            }),
            notValid: 'Please select a valid date',
            tooEarly: 'Date cannot be before %{date}',
            tooLate: 'Date cannot be after %{date}',
          },
          lookups: {
            formElement,
            elementIdsWithLookupsExecuted,
          },
        }
        break
      }
      case 'datetime': {
        partialSchema[escapeElementName(formElement.name)] = {
          presence: presence(
            formElement.required,
            'Please select a date and time',
          ),
          datetime: {
            format: (v: Date) => localisationService.formatDatetime(v),
            earliest: parseDateValue({
              dateOnly: false,
              daysOffset: formElement.fromDateDaysOffset,
              value: formElement.fromDate,
            }),
            latest: parseDateValue({
              dateOnly: false,
              daysOffset: formElement.toDateDaysOffset,
              value: formElement.toDate,
            }),
            notValid: 'Please select a valid date and time',
            tooEarly: 'Date and time cannot be before %{date}',
            tooLate: 'Date and time cannot be after %{date}',
          },
          lookups: {
            formElement,
            elementIdsWithLookupsExecuted,
          },
        }
        break
      }
      case 'number': {
        let minErrorMessage =
          'Please enter a number greater than or equal to %{count}'
        let maxErrorMessage =
          'Please enter a number less than or equal to %{count}'
        if (
          typeof formElement.minNumber === 'number' &&
          typeof formElement.maxNumber === 'number'
        ) {
          minErrorMessage =
            maxErrorMessage = `Please enter a number between ${formElement.minNumber} and ${formElement.maxNumber}`
        }

        partialSchema[escapeElementName(formElement.name)] = {
          type: 'number',
          presence: presence(formElement.required, 'Please enter a number'),
          numericality: {
            greaterThanOrEqualTo: formElement.minNumber,
            notGreaterThanOrEqualTo: minErrorMessage,
            lessThanOrEqualTo: formElement.maxNumber,
            notLessThanOrEqualTo: maxErrorMessage,
            onlyInteger: formElement.isInteger,
            notInteger: 'Please enter a whole number',
          },
          lookups: {
            formElement,
            elementIdsWithLookupsExecuted,
          },
          numberRegex: getCustomRegexFormatConfig(formElement),
        }
        break
      }
      case 'files': {
        partialSchema[escapeElementName(formElement.name)] = {
          presence: presence(
            !!formElement.minEntries,
            `Please upload at least ${formElement.minEntries || 1} file(s)`,
          ),
          length: {
            minimum: formElement.minEntries,
            maximum: formElement.maxEntries,
            tooLong: 'Cannot upload more than %{count} file(s)',
            tooShort: 'Please upload at least %{count} file(s)',
          },
          type: {
            type: (files: PossibleFileConfiguration[] | undefined) => {
              return (
                !Array.isArray(files) ||
                files.every((file) => {
                  return checkFileNameIsValid(formElement, file.fileName)
                })
              )
            },
            message: `Only the following file types are accepted: ${(
              formElement.restrictedFileTypes || []
            ).join(', ')}`,
          },
          attachments: !checkIsUsingLegacyStorage(formElement),
        }
        break
      }
      case 'repeatableSet': {
        partialSchema[escapeElementName(formElement.name)] = {
          entries: {
            setSchema: {
              presence: presence(
                !!formElement.minSetEntries,
                `Must have at least ${
                  formElement.minSetEntries || 1
                } entry/entries`,
              ),
              length: {
                minimum: formElement.minSetEntries,
                maximum: formElement.maxSetEntries,
                tooLong: 'Cannot have more than %{count} entry/entries',
                tooShort: 'Must have at least %{count} entry/entries',
              },
            },
            entrySchema: generateSchemaReducer(
              formElement.elements,
              elementIdsWithLookupsExecuted,
            ),
          },
        }
        break
      }
      case 'form': {
        if (formElement.elements) {
          partialSchema[escapeElementName(formElement.name)] = {
            nestedElements: generateSchemaReducer(
              formElement.elements,
              elementIdsWithLookupsExecuted,
            ),
          }
        }
        break
      }
      default: {
        console.info('Unsupported form element with validation', formElement)
      }
    }
    return partialSchema
  }, {})
}

const validateSingleMessageError = (
  submission: FormElementsCtrl['model'],
  schema: ValidateJSSchema,
): FormElementsValidation | undefined => {
  const errorsAsArray = validate(submission, schema, {
    format: 'grouped',
    fullMessages: false,
  })
  if (!errorsAsArray || validate.isEmpty(errorsAsArray)) {
    return
  }

  const errors = Object.keys(errorsAsArray || {}).reduce(
    (messagesByFormElementName: FormElementsValidation, key) => {
      const validationMessage = errorsAsArray[key][0]
      if (validationMessage) {
        messagesByFormElementName[key.replace(/\\./g, '.')] = validationMessage
      }
      return messagesByFormElementName
    },
    {},
  )
  if (validate.isEmpty(errors)) {
    return
  }

  return errors
}

export function checkFileNameIsValid(
  formElement: FormTypes.FilesElement,
  fileName: string,
) {
  const extension = fileName.split('.').pop()
  return (
    !formElement.restrictedFileTypes ||
    formElement.restrictedFileTypes.some((fileType) => fileType === extension)
  )
}
