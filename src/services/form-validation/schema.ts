import { ValidatorConstraintFn } from 'validate.js'
import { attachmentsService, localisationService } from '@oneblink/apps'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { parseDateValue } from '../generate-default-data'
import generateCivicaNameRecordElements from '../generateCivicaNameRecordElements'

import generateFreshdeskDependentFieldElements from '../generateFreshdeskDependentFieldElements'
import {
  presence,
  escapeElementName,
  getCleanDateRangeConfiguration,
  getCleanRepeatableSetConfiguration,
  getCustomRegexFormatConfig,
  checkFileNameIsValid,
} from './validators'

export type ValidateJSSchema = Record<string, unknown>

export default function generateValidationSchema(
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
      { formElementsConditionallyShown, executedLookups, captchaType },
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
          switch (captchaType) {
            case 'INVISIBLE':
              return
            case 'CHECKBOX':
            default:
              return {
                presence: presence(
                  { ...formElement, required: true },
                  'Please complete the CAPTCHA successfully',
                ),
              }
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
          const optionsLength =
            formElementConditionallyShown?.type === 'formElement' &&
            formElementConditionallyShown?.options
              ? formElementConditionallyShown?.options?.length
              : formElement.options?.length

          const requiredAllDefaultMessage = 'All options are required'
          return {
            presence: presence(
              {
                ...formElement,
                required:
                  !!optionsLength &&
                  (formElement.required || !!formElement.requiredAll),
              },
              formElement.requiredAll ? requiredAllDefaultMessage : 'Required',
            ),
            length: formElement.requiredAll
              ? {
                  is: optionsLength,
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
        case 'googleAddress':
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
            isTrue:
              formElement.required &&
              (formElement.requiredMessage || 'Required'),
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
