// import validate from 'validate.js'
import { z } from 'zod'
// import { localisationService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
// import { FormElementBinaryStorageValue } from '../types/attachments'
// import { PossibleFileConfiguration } from '../form-elements/FormElementFiles'
// import { Value as FormElementComplianceValue } from '../form-elements/FormElementCompliance'
// import { checkIsUsingLegacyStorage } from './attachments'
// import { parseDateValue } from './generate-default-data'
// import generateCivicaNameRecordElements from './generateCivicaNameRecordElements'
import {
  FormElementsConditionallyShown,
  FormElementsValidation,
  FormSubmissionModel,
} from '../types/form'

export const lookupValidationMessage = 'Lookup is required'
// https://validatejs.org/#validators-datetime
// Before using it we must add the parse and format functions
// Here is a sample implementation using moment.js
// validate.extend(validate.validators.datetime, {
//   // The value is guaranteed not to be null or undefined but otherwise it
//   // could be anything.
//   parse: function (value: string) {
//     return Date.parse(value)
//   },
//   // Input is a unix timestamp
//   format: function (
//     value: string,
//     options: { format: (date: Date) => string },
//   ) {
//     const dateValue = new Date(value)
//     return options.format(dateValue)
//   },
// })

// validate.validators.entries = function (
//   value: unknown,
//   {
//     setSchema,
//     entrySchema,
//   }: { setSchema: ValidateJSSchema; entrySchema: ValidateJSSchema },
// ) {
//   const entries = Array.isArray(value) ? value : []

//   const entryErrors = entries.reduce((errorsByIndex, entry, index) => {
//     const entryValidation = validateSingleMessageError(entry, entrySchema)
//     if (entryValidation) {
//       errorsByIndex[index] = entryValidation
//     }
//     return errorsByIndex
//   }, {})

//   const setErrorMessages = validate.single(value, setSchema)

//   if (!setErrorMessages && validate.isEmpty(entryErrors)) {
//     return
//   }

//   return {
//     type: 'repeatableSet',
//     set: setErrorMessages && setErrorMessages[0],
//     entries: entryErrors,
//   }
// }

// validate.validators.nestedElements = function (
//   value: FormSubmissionModel | undefined,
//   schema: ValidateJSSchema,
// ) {
//   const errors = validateSingleMessageError(value || {}, schema)
//   if (!errors) {
//     return
//   }
//   return {
//     type: 'formElements',
//     formElements: errors,
//   }
// }

// function getInvalidAttachment(value: FormElementBinaryStorageValue) {
//   if (
//     value &&
//     typeof value === 'object' &&
//     value.type &&
//     value.type === 'ERROR'
//   ) {
//     return value
//   }
// }
// function validateAttachments(
//   value: FormElementBinaryStorageValue[] | undefined,
// ) {
//   const invalidAttachmentNames = value?.reduce(
//     (invalidAttachmentNames: string[], att) => {
//       const attachmentName = getInvalidAttachment(att)?.fileName
//       if (attachmentName) {
//         invalidAttachmentNames.push(attachmentName)
//       }
//       return invalidAttachmentNames
//     },
//     [],
//   )
//   if (invalidAttachmentNames?.length) {
//     return `${invalidAttachmentNames.join(', ')} could not be uploaded.`
//   }
// }
// validate.validators.attachment = function (
//   value: FormElementBinaryStorageValue,
// ) {
//   return getInvalidAttachment(value)?.errorMessage
// }
// validate.validators.attachments = function (
//   value:
//     | FormElementBinaryStorageValue[]
//     | FormElementComplianceValue
//     | undefined,
// ) {
//   if (Array.isArray(value)) {
//     return validateAttachments(value)
//   }
//   return validateAttachments(
//     value?.files as FormElementBinaryStorageValue[] | undefined,
//   )
// }

// // Extend validator for lookups
// validate.validators.lookups = function (
//   value: unknown,
//   {
//     elementIdsWithLookupsExecuted,
//     formElement,
//   }: {
//     formElement: FormTypes.LookupFormElement & FormTypes.FormElementRequired
//     elementIdsWithLookupsExecuted: string[]
//   },
// ) {
//   if (!formElement.isDataLookup && !formElement.isElementLookup) {
//     return
//   }

//   // Lookups must only be executed on required form elements
//   if (formElement && !formElement.required) {
//     return
//   }

//   if (elementIdsWithLookupsExecuted.includes(formElement.id)) {
//     return
//   }

//   return lookupValidationMessage
// }

// validate.validators.numberRegex = function (value: unknown, format: unknown) {
//   if (!format) {
//     return
//   }
//   if (typeof value === 'number' && !Number.isNaN(value)) {
//     value = value.toString()
//   }
//   const errorMessages = validate.single(value, { format })
//   return errorMessages && errorMessages[0]
// }

// validate.validators.isTrue = function (value: unknown, message?: string) {
//   if (!value) {
//     return message || 'Must be set to true'
//   }
// }

function getCustomRegexSchema<DefaultValue>(
  formElement: FormTypes.FormElementWithInput<DefaultValue>,
  schema: z.ZodString,
): z.ZodString {
  if (formElement.regexPattern) {
    return schema.regex(
      new RegExp(formElement.regexPattern, formElement.regexFlags),
      {
        message: formElement.regexMessage,
      },
    )
  }
  return schema
}

// https://github.com/colinhacks/zod/issues/236
// validationSchema.current?.safeParse(values)?.error?.errors?.reduce(
//   (errors, error) =>
//     error.path.reduce((a, b, level) => {
//       if (level === error.path.length - 1) {
//         a[b] = error.message;

//         return errors;
//       }

//       if (!a[b]) {
//         a[b] = {};
//       }

//       return a[b];
//     }, errors),
//   {} as { [key: string]: any },
// );

export function validateSubmission(
  schema: z.ZodObject<z.ZodRawShape>,
  submission: FormSubmissionModel,
  formElementsConditionallyShown: FormElementsConditionallyShown,
): FormElementsValidation | undefined {
  const result = schema.safeParse(submission)
  if (result.success) {
    return
  }

  const zodIssues = result.error.issues.filter((zodIssue) => {
    return zodIssue.path.reduce(
      (
        memo: FormElementsConditionallyShown | undefined,
        formElementNameOrEntryIndex: string | number,
      ) => {
        const formElementConditionallyShown =
          memo?.[formElementNameOrEntryIndex]
        if (formElementConditionallyShown?.isHidden) {
          return
        }

        if (typeof formElementNameOrEntryIndex === 'number') {
          return formElementConditionallyShown as unknown as FormElementsConditionallyShown
        }

        switch (formElementConditionallyShown?.type) {
          case 'repeatableSet': {
            return formElementConditionallyShown.entries as FormElementsConditionallyShown
          }
          case 'formElements': {
            return formElementConditionallyShown.formElements
          }
          case 'formElement':
          default: {
            return {} as FormElementsConditionallyShown
          }
        }
      },
      formElementsConditionallyShown,
    )
  })

  if (!zodIssues.length) {
    return
  }

  // const correct: FormElementsValidation = {
  //   Entries: {
  //     type: 'repeatableSet',
  //     set: undefined,
  //     entries: {
  //       0: {
  //         Nested_Required_Text: 'Required',
  //       },
  //     },
  //   },
  // }

  // return zodIssues.reduce((errors, zodIssue) => {
  //   return zodIssue.path.reduce((memo, formElementNameOrEntryIndex, level) => {
  //     if (level === zodIssue.path.length - 1) {
  //       memo[formElementNameOrEntryIndex] = zodIssue.message

  //       return errors
  //     }

  //     if (!memo[formElementNameOrEntryIndex]) {
  //       memo[formElementNameOrEntryIndex] = {}
  //     }

  //     return memo[formElementNameOrEntryIndex]
  //   }, errors)
  // }, {} as { [key: string]: any })

  return zodIssues.reduce<FormElementsValidation>(
    (formElementsValidation: FormElementsValidation, zodIssue: z.ZodIssue) => {
      console.log('zodIssue', JSON.stringify(zodIssue, null, 2))
      return zodIssue.path.reduce<FormElementsValidation>(
        (
          nestedFormElementsValidation: FormElementsValidation,
          formElementNameOrEntryIndex: string | number,
          level: number,
        ) => {
          const nextFormElementNameOrEntryIndex = zodIssue.path[level + 1]
          console.log(
            JSON.stringify(
              {
                nestedFormElementsValidation,
                formElementNameOrEntryIndex,
                nextFormElementNameOrEntryIndex,
                level,
              },
              null,
              2,
            ),
          )
          if (typeof formElementNameOrEntryIndex === 'number') {
            return nestedFormElementsValidation
          }
          switch (typeof nextFormElementNameOrEntryIndex) {
            case 'number': {
              // parent is a repeatable set
              if (!nestedFormElementsValidation[formElementNameOrEntryIndex]) {
                nestedFormElementsValidation[formElementNameOrEntryIndex] = {
                  type: 'repeatableSet',
                  set: undefined,
                  entries: {},
                }
              }

              const formElementValidation =
                nestedFormElementsValidation[formElementNameOrEntryIndex]
              // @ts-expect-error ???
              formElementValidation.entries[nextFormElementNameOrEntryIndex] =
                {}
              // @ts-expect-error ???
              return formElementValidation.entries[
                nextFormElementNameOrEntryIndex
              ]
            }
            case 'string': {
              if (!nestedFormElementsValidation[formElementNameOrEntryIndex]) {
                nestedFormElementsValidation[formElementNameOrEntryIndex] = {
                  type: 'formElements',
                  formElements: {},
                }
              }
              const formElementValidation =
                nestedFormElementsValidation[formElementNameOrEntryIndex]
              // @ts-expect-error ???
              return formElementValidation.formElements
            }
            case 'undefined':
            default: {
              if (
                zodIssue.code === z.ZodIssueCode.too_small &&
                zodIssue.type === 'array'
              ) {
                if (
                  !nestedFormElementsValidation[formElementNameOrEntryIndex]
                ) {
                  nestedFormElementsValidation[formElementNameOrEntryIndex] = {
                    type: 'repeatableSet',
                    set: undefined,
                    entries: {},
                  }
                }
                // @ts-expect-error ???
                nestedFormElementsValidation[formElementNameOrEntryIndex].set =
                  zodIssue.message
              } else {
                nestedFormElementsValidation[formElementNameOrEntryIndex] =
                  zodIssue.message
              }
              return formElementsValidation
            }
          }
        },
        formElementsValidation,
      )
    },
    {} as FormElementsValidation,
  )
}

// const presence = (required: boolean, message: string) =>
//   required ? { message } : false

// const escapeElementName = (elementName: string) => {
//   const escapedName = elementName.replace(/\./g, '\\.')
//   return escapedName
// }

export function generateValidationSchema(
  elements: FormTypes.FormElement[],
  elementIdsWithLookupsExecuted: string[],
): z.ZodObject<z.ZodRawShape> {
  const schemaKeys = elements.reduce<z.ZodRawShape>(
    (partialSchema, formElement) => {
      switch (formElement.type) {
        case 'summary':
        case 'calculation':
        case 'image':
        case 'html':
        case 'infoPage':
        case 'heading': {
          break
        }
        case 'section':
        case 'page': {
          const nestedSchema: z.ZodObject<z.ZodRawShape> =
            generateValidationSchema(
              formElement.elements,
              elementIdsWithLookupsExecuted,
            )
          Object.assign(partialSchema, nestedSchema.shape)
          break
        }
        // case 'draw': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     attachment: !checkIsUsingLegacyStorage(formElement),
        //     presence: presence(formElement.required, 'A signature is required'),
        //   }
        //   break
        // }
        // case 'camera': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     attachment: !checkIsUsingLegacyStorage(formElement),
        //     presence: presence(formElement.required, 'A photo is required'),
        //   }
        //   break
        // }
        // case 'captcha': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     presence: presence(
        //       true,
        //       'Please complete the CAPTCHA successfully',
        //     ),
        //   }
        //   break
        // }
        // case 'location': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     presence: presence(
        //       formElement.required,
        //       'Please select a location',
        //     ),
        //     lookups: {
        //       formElement,
        //       elementIdsWithLookupsExecuted,
        //     },
        //   }
        //   break
        // }
        // case 'compliance': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     presence: presence(formElement.required, 'Required'),
        //     lookups: {
        //       formElement,
        //       elementIdsWithLookupsExecuted,
        //     },
        //     attachments: !checkIsUsingLegacyStorage(formElement),
        //   }
        //   break
        // }
        // case 'geoscapeAddress':
        // case 'pointAddress':
        // case 'civicaStreetName':
        // case 'autocomplete':
        // case 'checkboxes':
        // case 'radio':
        // case 'select': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     presence: presence(formElement.required, 'Required'),
        //     lookups: {
        //       formElement,
        //       elementIdsWithLookupsExecuted,
        //     },
        //   }
        //   break
        // }
        // case 'boolean': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     isTrue: formElement.required && 'Required',
        //     lookups: {
        //       formElement,
        //       elementIdsWithLookupsExecuted,
        //     },
        //   }
        //   break
        // }
        // case 'barcodeScanner': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     presence: presence(
        //       formElement.required,
        //       'Please scan a barcode or enter a value',
        //     ),
        //     lookups: {
        //       formElement,
        //       elementIdsWithLookupsExecuted,
        //     },
        //     format: getCustomRegexFormatConfig(formElement),
        //   }
        //   break
        // }
        case 'text':
        case 'textarea': {
          let schema = z.string().min(1 || formElement.minLength, {
            message: `Please enter a value with at least ${
              1 || formElement.minLength
            } character(s)`,
          })
          if (formElement.maxLength) {
            schema = schema.max(formElement.maxLength, {
              message: `Please enter a value with ${formElement.maxLength} character(s) or less`,
            })
          }
          schema = getCustomRegexSchema(formElement, schema)
          if (formElement.required) {
            partialSchema[formElement.name] = schema
          } else {
            partialSchema[formElement.name] = schema.optional()
          }
          break
        }
        // case 'telephone': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     presence: presence(
        //       formElement.required,
        //       'Please enter a phone number',
        //     ),
        //     lookups: {
        //       formElement,
        //       elementIdsWithLookupsExecuted,
        //     },
        //     format: getCustomRegexFormatConfig(formElement),
        //   }
        //   break
        // }
        // case 'email': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     presence: presence(
        //       formElement.required,
        //       'Please enter an email address',
        //     ),
        //     email: {
        //       message: 'Please enter a valid email for this field',
        //     },
        //     lookups: {
        //       formElement,
        //       elementIdsWithLookupsExecuted,
        //     },
        //     format: getCustomRegexFormatConfig(formElement),
        //   }
        //   break
        // }
        // case 'time': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     presence: presence(formElement.required, 'Please select a time'),
        //     lookups: {
        //       formElement,
        //       elementIdsWithLookupsExecuted,
        //     },
        //   }
        //   break
        // }
        // case 'date': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     presence: presence(formElement.required, 'Please select a date'),
        //     date: {
        //       format: (v: Date) => localisationService.formatDate(v),
        //       earliest: parseDateValue({
        //         dateOnly: true,
        //         daysOffset: formElement.fromDateDaysOffset,
        //         value: formElement.fromDate,
        //       }),
        //       latest: parseDateValue({
        //         dateOnly: true,
        //         daysOffset: formElement.toDateDaysOffset,
        //         value: formElement.toDate,
        //       }),
        //       notValid: 'Please select a valid date',
        //       tooEarly: 'Date cannot be before %{date}',
        //       tooLate: 'Date cannot be after %{date}',
        //     },
        //     lookups: {
        //       formElement,
        //       elementIdsWithLookupsExecuted,
        //     },
        //   }
        //   break
        // }
        // case 'datetime': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     presence: presence(
        //       formElement.required,
        //       'Please select a date and time',
        //     ),
        //     datetime: {
        //       format: (v: Date) => localisationService.formatDatetime(v),
        //       earliest: parseDateValue({
        //         dateOnly: false,
        //         daysOffset: formElement.fromDateDaysOffset,
        //         value: formElement.fromDate,
        //       }),
        //       latest: parseDateValue({
        //         dateOnly: false,
        //         daysOffset: formElement.toDateDaysOffset,
        //         value: formElement.toDate,
        //       }),
        //       notValid: 'Please select a valid date and time',
        //       tooEarly: 'Date and time cannot be before %{date}',
        //       tooLate: 'Date and time cannot be after %{date}',
        //     },
        //     lookups: {
        //       formElement,
        //       elementIdsWithLookupsExecuted,
        //     },
        //   }
        //   break
        // }
        // case 'number': {
        //   let minErrorMessage =
        //     'Please enter a number greater than or equal to %{count}'
        //   let maxErrorMessage =
        //     'Please enter a number less than or equal to %{count}'
        //   if (
        //     typeof formElement.minNumber === 'number' &&
        //     typeof formElement.maxNumber === 'number'
        //   ) {
        //     minErrorMessage =
        //       maxErrorMessage = `Please enter a number between ${formElement.minNumber} and ${formElement.maxNumber}`
        //   }

        //   partialSchema[escapeElementName(formElement.name)] = {
        //     type: 'number',
        //     presence: presence(formElement.required, 'Please enter a number'),
        //     numericality: {
        //       greaterThanOrEqualTo: formElement.minNumber,
        //       notGreaterThanOrEqualTo: minErrorMessage,
        //       lessThanOrEqualTo: formElement.maxNumber,
        //       notLessThanOrEqualTo: maxErrorMessage,
        //       onlyInteger: formElement.isInteger,
        //       notInteger: 'Please enter a whole number',
        //     },
        //     lookups: {
        //       formElement,
        //       elementIdsWithLookupsExecuted,
        //     },
        //     numberRegex: getCustomRegexFormatConfig(formElement),
        //   }
        //   break
        // }
        // case 'files': {
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     presence: presence(
        //       !!formElement.minEntries,
        //       `Please upload at least ${formElement.minEntries || 1} file(s)`,
        //     ),
        //     length: {
        //       minimum: formElement.minEntries,
        //       maximum: formElement.maxEntries,
        //       tooLong: 'Cannot upload more than %{count} file(s)',
        //       tooShort: 'Please upload at least %{count} file(s)',
        //     },
        //     type: {
        //       type: (files: PossibleFileConfiguration[] | undefined) => {
        //         return (
        //           !Array.isArray(files) ||
        //           files.every((file) => {
        //             return checkFileNameIsValid(formElement, file.fileName)
        //           })
        //         )
        //       },
        //       message: `Only the following file types are accepted: ${(
        //         formElement.restrictedFileTypes || []
        //       ).join(', ')}`,
        //     },
        //     attachments: !checkIsUsingLegacyStorage(formElement),
        //   }
        //   break
        // }
        case 'repeatableSet': {
          let nestedSchema = generateValidationSchema(
            formElement.elements,
            elementIdsWithLookupsExecuted,
          ).array()

          if (formElement.maxSetEntries) {
            nestedSchema = nestedSchema.max(formElement.maxSetEntries, {
              message: `Must have at least ${formElement.maxSetEntries} entry/entries`,
            })
          }
          if (formElement.minSetEntries) {
            partialSchema[formElement.name] = nestedSchema.min(
              formElement.minSetEntries,
              {
                message: `Cannot have more than ${formElement.minSetEntries} entry/entries`,
              },
            )
          } else {
            partialSchema[formElement.name] = nestedSchema.optional()
          }
          break
        }
        // case 'civicaNameRecord': {
        //   const nestedElements = generateCivicaNameRecordElements(
        //     formElement,
        //     [],
        //   )
        //   partialSchema[escapeElementName(formElement.name)] = {
        //     nestedElements: generateValidationSchema(
        //       nestedElements,
        //       elementIdsWithLookupsExecuted,
        //     ),
        //   }
        //   break
        // }
        case 'form': {
          if (formElement.elements) {
            partialSchema[formElement.name] = generateValidationSchema(
              formElement.elements,
              elementIdsWithLookupsExecuted,
            )
          }
          break
        }
        default: {
          // console.info('Unsupported form element with validation', formElement)
        }
      }
      return partialSchema
    },
    {},
  )
  return z.object(schemaKeys)
}

// const validateSingleMessageError = (
//   submission: FormSubmissionModel,
//   schema: z.ZodObject<z.ZodRawShape>,
// ): FormElementsValidation | undefined => {
//   const errorsAsArray = schema.par
//   if (!errorsAsArray || validate.isEmpty(errorsAsArray)) {
//     return
//   }

//   const errors = Object.keys(errorsAsArray || {}).reduce(
//     (messagesByFormElementName: FormElementsValidation, key) => {
//       const validationMessage = errorsAsArray[key][0]
//       if (validationMessage) {
//         messagesByFormElementName[key.replace(/\\./g, '.')] = validationMessage
//       }
//       return messagesByFormElementName
//     },
//     {},
//   )
//   if (validate.isEmpty(errors)) {
//     return
//   }

//   return errors
// }

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
