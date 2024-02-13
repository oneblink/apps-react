import validate, { ValidatorConstraintFn } from 'validate.js'
import { attachmentsService, localisationService } from '@oneblink/apps'
import { FormTypes, FormsAppsTypes, SubmissionTypes } from '@oneblink/types'
import { FormElementBinaryStorageValue } from '../types/attachments'
import { Value as FormElementComplianceValue } from '../form-elements/FormElementCompliance'
import { parseDateValue } from './generate-default-data'
import generateCivicaNameRecordElements from './generateCivicaNameRecordElements'
import {
  ExecutedLookups,
  ExecutedLookupValue,
  FormElementConditionallyShown,
  FormElementsConditionallyShown,
  FormElementsValidation,
} from '../types/form'
import generateFreshdeskDependentFieldElements from './generateFreshdeskDependentFieldElements'
import cleanFormSubmissionModel from './cleanFormSubmissionModel'
import getDateRangeConfiguration, {
  DateRangeConfigurationOptions,
} from './getDateRangeConfiguration'
import getRepeatableSetEntriesConfiguration from './getRepeatableSetEntriesConfiguration'

type NestedValidateJSSchema = {
  schema: ValidateJSSchema
  formElementConditionallyShown: FormElementConditionallyShown | undefined
  executedLookups: ExecutedLookupValue
}

export const generateLookupValidationMessage = (
  lookupButtonConfig?: FormsAppsTypes.ButtonConfiguration,
) => {
  return lookupButtonConfig && lookupButtonConfig.label
    ? `${lookupButtonConfig.label} is required`
    : 'Lookup is required'
}

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
    entrySchema: {
      schema: entrySchema,
      formElementConditionallyShown,
      executedLookups,
    },
  }: {
    setSchema: ValidateJSSchema
    entrySchema: NestedValidateJSSchema
  },
) {
  const entries = Array.isArray(value) ? value : []

  const entryErrors = entries.reduce((errorsByIndex, entry, index) => {
    const entryValidation = validateSubmission(
      entrySchema,
      entry,
      formElementConditionallyShown?.type === 'repeatableSet'
        ? formElementConditionallyShown.entries[index.toString()]
        : undefined,
      Array.isArray(executedLookups) ? executedLookups[index] : {},
    )
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
  value: SubmissionTypes.S3SubmissionData['submission'] | undefined,
  {
    schema,
    formElementConditionallyShown,
    executedLookups,
  }: NestedValidateJSSchema,
) {
  const errors = validateSubmission(
    schema,
    value,
    formElementConditionallyShown?.type === 'formElements'
      ? formElementConditionallyShown.formElements
      : undefined,
    typeof executedLookups !== 'boolean' ? executedLookups : {},
  )
  if (!errors) {
    return
  }
  return {
    type: 'formElements',
    formElements: errors,
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
    executedLookups,
    formElement,
  }: {
    formElement: FormTypes.LookupFormElement & FormTypes.FormElementRequired
    executedLookups: ExecutedLookups
  },
) {
  if (!formElement.isDataLookup && !formElement.isElementLookup) {
    return
  }

  // Lookups must only be executed on required form elements
  if (formElement && !formElement.required) {
    return
  }

  const elementExecutedLookups = executedLookups?.[formElement.name]
  if (elementExecutedLookups === true) {
    return
  }
  return generateLookupValidationMessage(formElement.lookupButton)
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

validate.validators.needsExtension = function (
  value: attachmentsService.Attachment[] | undefined,
  formElement: FormTypes.FilesElement,
) {
  const isValid =
    !Array.isArray(value) ||
    value.every((file) => {
      return checkFileNameExtensionIsValid(formElement, file.fileName)
    })
  if (!isValid) return 'All files must have extensions'
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

const presence = (
  { required, requiredMessage }: FormTypes.FormElementRequired,
  message: string,
) => (required ? { message: requiredMessage || message } : false)

const escapeElementName = (elementName: string) => {
  const escapedName = elementName.replace(/\./g, '\\.')
  return escapedName
}

function getCleanDateRangeConfiguration(
  options: DateRangeConfigurationOptions,
  elements: FormTypes.FormElement[],
  submission: SubmissionTypes.S3SubmissionData['submission'] | undefined,
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
): ReturnType<typeof getDateRangeConfiguration> {
  if (options.referenceFormElementId && submission) {
    const { model } = cleanFormSubmissionModel(
      submission,
      elements,
      formElementsConditionallyShown,
      true,
    )
    return getDateRangeConfiguration(options, elements, model)
  }
  return [options.date, options.daysOffset]
}

function getCleanRepeatableSetConfiguration(
  setEntries: FormTypes.RepeatableSetElement['minSetEntries'],
  elements: FormTypes.FormElement[],
  submission: SubmissionTypes.S3SubmissionData['submission'] | undefined,
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
) {
  if (submission) {
    const { model } = cleanFormSubmissionModel(
      submission,
      elements,
      formElementsConditionallyShown,
      true,
    )
    return getRepeatableSetEntriesConfiguration(setEntries, elements, model)
  }
}

export function generateValidationSchema(
  elements: FormTypes.FormElementWithName[],
): ValidateJSSchema {
  return elements.reduce<ValidateJSSchema>((partialSchema, formElement) => {
    switch (formElement.type) {
      // Elements that do not need to be validated
      case 'summary':
      case 'calculation':
      case 'image':
      case 'html':
      case 'heading':
      case 'arcGISWebMap': {
        return partialSchema
      }
    }

    const constraint: ValidatorConstraintFn<
      SubmissionTypes.S3SubmissionData['submission']
    > = (
      value,
      submission,
      propertyName,
      { formElementsConditionallyShown, executedLookups },
    ) => {
      // If the element is current hidden, we do not need to apply validation
      const formElementConditionallyShown =
        formElementsConditionallyShown?.[formElement.name]
      if (formElementConditionallyShown?.isHidden) {
        return
      }

      switch (formElement.type) {
        case 'draw': {
          return {
            attachment: true,
            presence: presence(formElement, 'A saved signature is required'),
          }
        }
        case 'camera': {
          return {
            attachment: true,
            presence: presence(formElement, 'A photo is required'),
          }
        }
        case 'captcha': {
          return {
            presence: presence(
              { ...formElement, required: true },
              'Please complete the CAPTCHA successfully',
            ),
          }
        }
        case 'location': {
          return {
            presence: presence(formElement, 'Please select a location'),
            lookups: {
              formElement,
              executedLookups,
            },
          }
        }
        case 'compliance': {
          return {
            presence: presence(formElement, 'Required'),
            lookups: {
              formElement,
              executedLookups,
            },
            attachments: true,
          }
        }
        case 'checkboxes': {
          const requiredAllDefaultMessage = 'All options are required'
          return {
            presence: presence(
              {
                ...formElement,
                required: formElement.required || !!formElement.requiredAll,
              },
              formElement.requiredAll ? requiredAllDefaultMessage : 'Required',
            ),
            length: formElement.requiredAll
              ? {
                  is: formElement.options?.length,
                  message:
                    formElement.requiredMessage || requiredAllDefaultMessage,
                }
              : undefined,
            lookups: {
              formElement,
              executedLookups,
            },
          }
        }
        case 'abn':
        case 'geoscapeAddress':
        case 'pointAddress':
        case 'civicaStreetName':
        case 'autocomplete':
        case 'radio':
        case 'select':
        case 'apiNSWLiquorLicence': {
          return {
            presence: presence(formElement, 'Required'),
            lookups: {
              formElement,
              executedLookups,
            },
          }
        }
        case 'boolean': {
          return {
            isTrue: formElement.required && 'Required',
            lookups: {
              formElement,
              executedLookups,
            },
          }
        }
        case 'bsb': {
          return {
            presence: presence(formElement, 'Please enter a BSB number'),
            format: {
              pattern: /\d{3}-\d{3}/,
              message: 'Please enter a valid BSB number',
            },
            lookups: {
              formElement,
              executedLookups,
            },
          }
        }
        case 'barcodeScanner': {
          return {
            presence: presence(
              formElement,
              'Please scan a barcode or enter a value',
            ),
            format: getCustomRegexFormatConfig(formElement),
            lookups: {
              formElement,
              executedLookups,
            },
          }
        }
        case 'text':
        case 'textarea': {
          return {
            presence: presence(formElement, 'Please enter a value'),
            length: {
              minimum: formElement.minLength,
              tooShort:
                'Please enter a value with at least %{count} character(s)',
              maximum: formElement.maxLength,
              tooLong:
                'Please enter a value with %{count} character(s) or less',
            },
            format: getCustomRegexFormatConfig(formElement),
            lookups: {
              formElement,
              executedLookups,
            },
          }
        }
        case 'telephone': {
          return {
            presence: presence(formElement, 'Please enter a phone number'),
            format: getCustomRegexFormatConfig(formElement),
            lookups: {
              formElement,
              executedLookups,
            },
          }
        }
        case 'email': {
          return {
            presence: presence(formElement, 'Please enter an email address'),
            email: {
              message: 'Please enter a valid email for this field',
            },
            format: getCustomRegexFormatConfig(formElement),
            lookups: {
              formElement,
              executedLookups,
            },
          }
        }
        case 'time': {
          return {
            presence: presence(formElement, 'Please select a time'),
            lookups: {
              formElement,
              executedLookups,
            },
          }
        }
        case 'date': {
          const [fromDate, fromDateDaysOffset] = getCleanDateRangeConfiguration(
            {
              date: formElement.fromDate,
              daysOffset: formElement.fromDateDaysOffset,
              referenceFormElementId: formElement.fromDateElementId,
            },
            elements,
            submission,
            formElementsConditionallyShown,
          )
          const [toDate, toDateDaysOffset] = getCleanDateRangeConfiguration(
            {
              date: formElement.toDate,
              daysOffset: formElement.toDateDaysOffset,
              referenceFormElementId: formElement.toDateElementId,
            },
            elements,
            submission,
            formElementsConditionallyShown,
          )
          return {
            presence: presence(formElement, 'Please select a date'),
            date: {
              format: (v: Date) => localisationService.formatDate(v),
              earliest: parseDateValue({
                dateOnly: true,
                daysOffset: fromDateDaysOffset,
                value: fromDate,
              }),
              latest: parseDateValue({
                dateOnly: true,
                daysOffset: toDateDaysOffset,
                value: toDate,
              }),
              notValid: 'Please select a valid date',
              tooEarly: 'Date cannot be before %{date}',
              tooLate: 'Date cannot be after %{date}',
            },
            lookups: {
              formElement,
              executedLookups,
            },
          }
        }
        case 'datetime': {
          const [fromDate, fromDateDaysOffset] = getCleanDateRangeConfiguration(
            {
              date: formElement.fromDate,
              daysOffset: formElement.fromDateDaysOffset,
              referenceFormElementId: formElement.fromDateElementId,
            },
            elements,
            submission,
            formElementsConditionallyShown,
          )
          const [toDate, toDateDaysOffset] = getCleanDateRangeConfiguration(
            {
              date: formElement.toDate,
              daysOffset: formElement.toDateDaysOffset,
              referenceFormElementId: formElement.toDateElementId,
            },
            elements,
            submission,
            formElementsConditionallyShown,
          )
          return {
            presence: presence(formElement, 'Please select a date and time'),
            datetime: {
              format: (v: Date) => localisationService.formatDatetime(v),
              earliest: parseDateValue({
                dateOnly: false,
                daysOffset: fromDateDaysOffset,
                value: fromDate,
              }),
              latest: parseDateValue({
                dateOnly: false,
                daysOffset: toDateDaysOffset,
                value: toDate,
              }),
              notValid: 'Please select a valid date and time',
              tooEarly: 'Date and time cannot be before %{date}',
              tooLate: 'Date and time cannot be after %{date}',
            },
            lookups: {
              formElement,
              executedLookups,
            },
          }
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

          return {
            type: 'number',
            presence: presence(formElement, 'Please enter a number'),
            numericality: {
              greaterThanOrEqualTo: formElement.minNumber,
              notGreaterThanOrEqualTo: minErrorMessage,
              lessThanOrEqualTo: formElement.maxNumber,
              notLessThanOrEqualTo: maxErrorMessage,
              onlyInteger: formElement.isInteger,
              notInteger: 'Please enter a whole number',
            },
            numberRegex: getCustomRegexFormatConfig(formElement),
            lookups: {
              formElement,
              executedLookups,
            },
          }
        }
        case 'files': {
          return {
            presence: formElement.minEntries
              ? {
                  message: `Please upload at least ${
                    formElement.minEntries
                  } file${formElement.minEntries === 1 ? '' : 's'}`,
                }
              : false,
            length: {
              minimum: formElement.minEntries,
              maximum: formElement.maxEntries,
              tooLong: 'Cannot upload more than %{count} file(s)',
              tooShort: 'Please upload at least %{count} file(s)',
            },
            type: {
              type: (files: attachmentsService.Attachment[] | undefined) => {
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
            needsExtension: formElement,
            attachments: true,
          }
        }
        case 'repeatableSet': {
          const minSetEntries = getCleanRepeatableSetConfiguration(
            formElement.minSetEntries,
            elements,
            submission,
            formElementsConditionallyShown,
          )
          const maxSetEntries = getCleanRepeatableSetConfiguration(
            formElement.maxSetEntries,
            elements,
            submission,
            formElementsConditionallyShown,
          )

          const repeatableSetExecutedLookups =
            executedLookups !== undefined &&
            typeof executedLookups !== 'boolean' &&
            !Array.isArray(executedLookups) &&
            Array.isArray(executedLookups[formElement.name])
              ? executedLookups[formElement.name]
              : []

          return {
            entries: {
              setSchema: {
                presence: minSetEntries
                  ? {
                      message: `Must have at least ${minSetEntries} ${
                        minSetEntries === 1 ? 'entry' : 'entries'
                      }`,
                    }
                  : false,
                length: {
                  minimum: minSetEntries,
                  maximum: maxSetEntries,
                  tooLong: 'Cannot have more than %{count} entry/entries',
                  tooShort: 'Must have at least %{count} entry/entries',
                },
              },
              entrySchema: {
                schema: generateValidationSchema(
                  formElement.elements as FormTypes.FormElementWithName[],
                ),
                formElementConditionallyShown:
                  formElementsConditionallyShown?.[formElement.name],
                executedLookups: repeatableSetExecutedLookups,
              },
            },
          }
        }
        case 'civicaNameRecord': {
          const nestedElements = generateCivicaNameRecordElements(
            formElement,
            [],
          )
          const nestedExecutedLookups =
            executedLookups !== undefined &&
            typeof executedLookups !== 'boolean' &&
            !Array.isArray(executedLookups)
              ? executedLookups[formElement.name]
              : {}
          return {
            nestedElements: {
              schema: generateValidationSchema(
                nestedElements as FormTypes.FormElementWithName[],
              ),
              formElementConditionallyShown:
                formElementsConditionallyShown?.[formElement.name],
              executedLookups: nestedExecutedLookups,
            },
          }
        }
        case 'infoPage':
        case 'form': {
          if (formElement.elements) {
            const nestedExecutedLookups =
              executedLookups !== undefined &&
              typeof executedLookups !== 'boolean' &&
              !Array.isArray(executedLookups)
                ? executedLookups[formElement.name]
                : {}
            return {
              nestedElements: {
                schema: generateValidationSchema(
                  formElement.elements as FormTypes.FormElementWithName[],
                ),
                formElementConditionallyShown:
                  formElementsConditionallyShown?.[formElement.name],
                executedLookups: nestedExecutedLookups,
              },
            }
          }
          break
        }
        case 'freshdeskDependentField': {
          const nestedElements =
            generateFreshdeskDependentFieldElements(formElement)
          const nestedExecutedLookups =
            executedLookups !== undefined &&
            typeof executedLookups !== 'boolean' &&
            !Array.isArray(executedLookups)
              ? executedLookups[formElement.name]
              : {}
          return {
            nestedElements: {
              schema: generateValidationSchema(
                nestedElements as FormTypes.FormElementWithName[],
              ),
              formElementConditionallyShown:
                formElementsConditionallyShown?.[formElement.name],
              executedLookups: nestedExecutedLookups,
            },
          }
        }
        default: {
          console.info('Unsupported form element with validation', formElement)
        }
      }
    }
    partialSchema[escapeElementName(formElement.name)] = constraint
    return partialSchema
  }, {})
}

export function validateSubmission(
  schema: ValidateJSSchema,
  submission: SubmissionTypes.S3SubmissionData['submission'] | undefined,
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
  executedLookups: ExecutedLookupValue,
): FormElementsValidation | undefined {
  const errorsAsArray = validate(submission, schema, {
    format: 'grouped',
    fullMessages: false,
    formElementsConditionallyShown,
    executedLookups,
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
    formElement.restrictedFileTypes.some(
      (fileType) => fileType.toLowerCase() === extension?.toLowerCase(),
    )
  )
}

export function checkFileNameExtensionIsValid(
  formElement: FormTypes.FilesElement,
  fileName: string,
) {
  return (
    formElement.allowExtensionlessAttachments || fileName.split('.').length >= 2
  )
}

export function checkSectionValidity(
  element: FormTypes.PageElement | FormTypes.SectionElement,
  formElementsValidation: FormElementsValidation | undefined,
): boolean {
  // If everything is valid, no need to check elements
  if (!formElementsValidation) {
    return false
  }

  // If there is no elements on the page that are invalid, we will treat as valid
  return element.elements.some((formElement) => {
    switch (formElement.type) {
      case 'page':
      case 'section': {
        return checkSectionValidity(formElement, formElementsValidation)
      }
      default: {
        return formElementsValidation[formElement.name]
      }
    }
  })
}
