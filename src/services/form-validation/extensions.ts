import validate from 'validate.js'
import { ValidateJSSchema } from './schema'
import {
  CaptchaType,
  ExecutedLookups,
  ExecutedLookupValue,
  FormElementConditionallyShown,
} from '../../types/form'
import { FormsAppsTypes, FormTypes, SubmissionTypes } from '@oneblink/types'
import { FormElementBinaryStorageValue } from '../../types/attachments'
import { Value as FormElementComplianceValue } from '../../form-elements/FormElementCompliance'
import { attachmentsService } from '@oneblink/apps'
import validateSubmission from '.'
import { checkFileNameExtensionIsValid } from './validators'

type NestedValidateJSSchema = {
  schema: ValidateJSSchema
  formElementConditionallyShown: FormElementConditionallyShown | undefined
  executedLookups: ExecutedLookupValue
  captchaType: CaptchaType
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
      captchaType,
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
      captchaType,
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
    captchaType,
  }: NestedValidateJSSchema,
) {
  const errors = validateSubmission(
    schema,
    value,
    formElementConditionallyShown?.type === 'formElements'
      ? formElementConditionallyShown.formElements
      : undefined,
    typeof executedLookups !== 'boolean' ? executedLookups : {},
    captchaType,
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

export const generateLookupValidationMessage = (
  lookupButtonConfig?: FormsAppsTypes.ButtonConfiguration,
) => {
  return lookupButtonConfig && lookupButtonConfig.label
    ? `${lookupButtonConfig.label} is required`
    : 'Lookup is required'
}

export default validate
