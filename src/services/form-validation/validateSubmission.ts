import { FormTypes, SubmissionTypes } from '@oneblink/types'
import {
  CaptchaType,
  ExecutedLookups,
  FormElementsConditionallyShown,
  FormElementsValidation,
} from '../../types/form'

import { isEmpty, validators } from './validate-dot-js'
import validationExtensions from './extensions'
import {
  checkFileNameExtensionIsValid,
  checkFileNameIsValid,
  getCleanRepeatableSetConfiguration,
  getCleanDateRangeConfiguration,
} from './validators'
import generateCivicaNameRecordElements from '../generateCivicaNameRecordElements'
import generateFreshdeskDependentFieldElements from '../generateFreshdeskDependentFieldElements'
import { parseDateValue } from '../generate-default-data'
import { localisationService } from '@oneblink/apps'

export default function validateSubmission({
  elements,
  submission,
  formElementsConditionallyShown,
  executedLookups,
  captchaType,
}: {
  elements: FormTypes.FormElementWithName[]
  submission: SubmissionTypes.S3SubmissionData['submission']
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  executedLookups: ExecutedLookups
  captchaType: CaptchaType
}): FormElementsValidation | undefined {
  const formElementsValidation = elements.reduce<FormElementsValidation>(
    (partialFormElementsValidation, formElement) => {
      switch (formElement.type) {
        // Elements that do not need to be validated
        case 'summary':
        case 'calculation':
        case 'image':
        case 'html':
        case 'heading':
        case 'arcGISWebMap': {
          return partialFormElementsValidation
        }
      }

      // If the element is current hidden, we do not need to apply validation
      const formElementConditionallyShown =
        formElementsConditionallyShown?.[formElement.name]
      if (formElementConditionallyShown?.isHidden) {
        return partialFormElementsValidation
      }

      const value = submission?.[formElement.name]

      switch (formElement.type) {
        case 'draw': {
          const errorMessages = [
            ...validationExtensions.presence(
              value,
              formElement,
              'A saved signature is required',
            ),
            ...validationExtensions.attachment(value),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
        }
        case 'camera': {
          const errorMessages = [
            ...validationExtensions.presence(
              value,
              formElement,
              'A photo is required',
            ),
            ...validationExtensions.attachment(value),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
        }
        case 'captcha': {
          switch (captchaType) {
            case 'INVISIBLE':
              break
            case 'CHECKBOX':
            default: {
              const errorMessages = validationExtensions.presence(
                value,
                { ...formElement, required: true },
                'Please complete the CAPTCHA successfully',
              )
              if (errorMessages.length) {
                partialFormElementsValidation[formElement.name] =
                  errorMessages[0]
              }
            }
          }
          break
        }
        case 'location': {
          const errorMessages = [
            ...validationExtensions.presence(
              value,
              formElement,
              'Please select a location',
            ),
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
        }
        case 'compliance': {
          const errorMessages = [
            ...validationExtensions.presence(value, formElement, 'Required'),
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
            ...validationExtensions.attachments(value as undefined),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
        }
        case 'checkboxes': {
          const optionsLength =
            formElementConditionallyShown?.type === 'formElement' &&
            formElementConditionallyShown?.options
              ? formElementConditionallyShown?.options?.length
              : formElement.options?.length
          const requiredAllDefaultMessage = 'All options are required'
          const errorMessages = validationExtensions.presence(
            value,
            {
              ...formElement,
              required:
                !!optionsLength &&
                (formElement.required || !!formElement.requiredAll),
            },
            formElement.requiredAll ? requiredAllDefaultMessage : 'Required',
          )
          if (formElement.requiredAll) {
            errorMessages.push(
              ...validators.length(value, {
                is: optionsLength,
                message:
                  formElement.requiredMessage || requiredAllDefaultMessage,
              }),
            )
          }
          errorMessages.push(
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          )
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
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
          const errorMessages = [
            ...validationExtensions.presence(value, formElement, 'Required'),
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
        }
        case 'boolean': {
          const errorMessages = []
          if (value !== true && formElement.required) {
            errorMessages.push(formElement.requiredMessage || 'Required')
          }
          errorMessages.push(
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          )
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
        }
        case 'bsb': {
          const errorMessages = [
            ...validationExtensions.presence(
              value,
              formElement,
              'Please enter a BSB number',
            ),
            ...validators.regexValidation(value, {
              pattern: /\d{3}-\d{3}/,
              message: 'Please enter a valid BSB number',
            }),
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
        }
        case 'barcodeScanner': {
          const errorMessages = [
            ...validationExtensions.presence(
              value,
              formElement,
              'Please scan a barcode or enter a value',
            ),
            ...validationExtensions.regex(value, formElement),
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
        }
        case 'text':
        case 'textarea': {
          const errorMessages = [
            ...validationExtensions.presence(
              value,
              formElement,
              'Please enter a value',
            ),
            ...validators.length(value, {
              minimum: formElement.minLength,
              tooShort:
                'Please enter a value with at least %{count} character(s)',
              maximum: formElement.maxLength,
              tooLong:
                'Please enter a value with %{count} character(s) or less',
            }),
            ...validationExtensions.regex(value, formElement),
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
        }
        case 'telephone': {
          const errorMessages = [
            ...validationExtensions.presence(
              value,
              formElement,
              'Please enter a phone number',
            ),
            ...validationExtensions.regex(value, formElement),
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
        }
        case 'email': {
          const errorMessages = [
            ...validationExtensions.presence(
              value,
              formElement,
              'Please enter an email address',
            ),
            ...validators.email(value, {
              message: 'Please enter a valid email for this field',
            }),
            ...validationExtensions.regex(value, formElement),
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
        }
        case 'time': {
          const errorMessages = [
            ...validationExtensions.presence(
              value,
              formElement,
              'Please select a time',
            ),
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
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

          const errorMessages = [
            ...validationExtensions.presence(
              value,
              formElement,
              'Please select a date',
            ),
            ...validators.datetime(value, {
              dateOnly: true,
              format: (date: Date) => localisationService.formatDate(date),
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
            }),
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
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

          const errorMessages = [
            ...validationExtensions.presence(
              value,
              formElement,
              'Please select a date and time',
            ),
            ...validators.datetime(value, {
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
            }),
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          ]
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
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

          const errorMessages = [
            ...validationExtensions.presence(
              value,
              formElement,
              'Please enter a number',
            ),
            ...validators.numericality(value, {
              greaterThanOrEqualTo: formElement.minNumber,
              notGreaterThanOrEqualTo: minErrorMessage,
              lessThanOrEqualTo: formElement.maxNumber,
              notLessThanOrEqualTo: maxErrorMessage,
              onlyInteger: formElement.isInteger,
              notInteger: 'Please enter a whole number',
              notValid: 'Enter enter a valid number',
            }),
          ]
          if (
            formElement.regexPattern &&
            typeof value === 'number' &&
            !Number.isNaN(value)
          ) {
            errorMessages.push(
              ...validationExtensions.regex(value.toString(), formElement),
            )
          }
          errorMessages.push(
            ...validationExtensions.lookups({
              formElement,
              executedLookups,
            }),
          )
          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
        }
        case 'files': {
          const errorMessages = []
          if (formElement.minEntries) {
            errorMessages.push(
              ...validators.presence(value, {
                message: `Please upload at least ${
                  formElement.minEntries
                } file${formElement.minEntries === 1 ? '' : 's'}`,
              }),
            )
          }
          errorMessages.push(
            ...validators.length(value, {
              minimum: formElement.minEntries,
              maximum: formElement.maxEntries,
              tooLong: 'Cannot upload more than %{count} file(s)',
              tooShort: 'Please upload at least %{count} file(s)',
            }),
          )

          if (
            !Array.isArray(value) ||
            value.every((file) => {
              return checkFileNameIsValid(formElement, file.fileName)
            })
          ) {
            errorMessages.push(
              `Only the following file types are accepted: ${(
                formElement.restrictedFileTypes || []
              ).join(', ')}`,
            )
          }

          errorMessages.push(
            ...validationExtensions.attachments(value as undefined),
          )

          const isValid =
            !Array.isArray(value) ||
            value.every((file) => {
              return checkFileNameExtensionIsValid(formElement, file.fileName)
            })
          if (!isValid) errorMessages.push('All files must have extensions')

          if (errorMessages.length) {
            partialFormElementsValidation[formElement.name] = errorMessages[0]
          }
          break
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

          const setErrorMessages = []
          if (minSetEntries) {
            setErrorMessages.push(
              ...validators.presence(value, {
                message: `Must have at least ${minSetEntries} ${
                  minSetEntries === 1 ? 'entry' : 'entries'
                }`,
              }),
            )
          }
          setErrorMessages.push(
            ...validators.length(value, {
              minimum: minSetEntries,
              maximum: maxSetEntries,
              tooLong: 'Cannot have more than %{count} entry/entries',
              tooShort: 'Must have at least %{count} entry/entries',
            }),
          )

          const entries = Array.isArray(value) ? value : []

          const entryErrors = entries.reduce((errorsByIndex, entry, index) => {
            const entryValidation = validateSubmission({
              submission: entry,
              elements: formElement.elements as FormTypes.FormElementWithName[],
              executedLookups: Array.isArray(executedLookups)
                ? executedLookups[index]
                : {},
              formElementsConditionallyShown:
                formElementConditionallyShown?.type === 'repeatableSet'
                  ? formElementConditionallyShown.entries[index.toString()]
                  : undefined,
              captchaType,
            })

            if (entryValidation) {
              errorsByIndex[index] = entryValidation
            }
            return errorsByIndex
          }, {})

          if (setErrorMessages.length || !isEmpty(entryErrors)) {
            partialFormElementsValidation = {
              type: 'repeatableSet',
              set: setErrorMessages[0],
              entries: entryErrors,
            }
          }
          break
        }
        case 'civicaNameRecord': {
          const nestedElements = generateCivicaNameRecordElements(
            formElement,
            [],
          )
          const nestedFormValidation = validationExtensions.nestedElements(
            value,
            {
              formElement,
              formElements: nestedElements,
              formElementsConditionallyShown,
              executedLookups,
              captchaType,
            },
          )
          if (nestedFormValidation) {
            partialFormElementsValidation[formElement.name] =
              nestedFormValidation
          }
          break
        }
        case 'infoPage':
        case 'form': {
          const nestedFormValidation = validationExtensions.nestedElements(
            value,
            {
              formElement,
              formElements:
                formElement.elements as FormTypes.FormElementWithName[],
              formElementsConditionallyShown,
              executedLookups,
              captchaType,
            },
          )
          if (nestedFormValidation) {
            partialFormElementsValidation[formElement.name] =
              nestedFormValidation
          }
          break
        }
        case 'freshdeskDependentField': {
          const nestedElements =
            generateFreshdeskDependentFieldElements(formElement)
          const nestedFormValidation = validationExtensions.nestedElements(
            value,
            {
              formElement,
              formElements: nestedElements,
              formElementsConditionallyShown,
              executedLookups,
              captchaType,
            },
          )
          if (nestedFormValidation) {
            partialFormElementsValidation[formElement.name] =
              nestedFormValidation
          }
          break
        }
        default: {
          console.info('Unsupported form element with validation', formElement)
        }
      }

      return partialFormElementsValidation
    },
    {},
  )

  if (isEmpty(formElementsValidation)) {
    return
  }

  return formElementsValidation
}
