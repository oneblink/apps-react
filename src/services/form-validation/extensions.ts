import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { FormElementBinaryStorageValue } from '../../types/attachments'
import {
  CaptchaType,
  ExecutedLookups,
  FormElementsConditionallyShown,
} from '../../types/form'
import validateSubmission from './validateSubmission'
import {
  generateLookupValidationMessage,
  getInvalidAttachment,
  validateAttachments,
} from './validators'
import { validators } from './validate-dot-js'
import { Value as FormElementComplianceValue } from '../../form-elements/FormElementCompliance'

const validationExtensions = {
  lookups({
    executedLookups,
    formElement,
  }: {
    formElement: FormTypes.LookupFormElement & FormTypes.FormElementRequired
    executedLookups: ExecutedLookups
  }): string[] {
    if (!formElement.isDataLookup && !formElement.isElementLookup) {
      return []
    }

    // Lookups must only be executed on required form elements
    if (formElement && !formElement.required) {
      return []
    }

    const elementExecutedLookups = executedLookups?.[formElement.name]
    if (elementExecutedLookups === true) {
      return []
    }

    return [generateLookupValidationMessage(formElement.lookupButton)]
  },

  presence(
    value: unknown,
    { required, requiredMessage }: FormTypes.FormElementRequired,
    message: string,
  ) {
    if (required) {
      return validators.presence(value, {
        message: requiredMessage || message,
      })
    }
    return []
  },

  regex<DefaultValue>(
    value: unknown,
    formElement: FormTypes.FormElementWithInput<DefaultValue>,
  ) {
    if (formElement.regexPattern) {
      return validators.regexValidation(value, {
        pattern: formElement.regexPattern,
        flags: formElement.regexFlags,
        message: formElement.regexMessage,
      })
    }
    return []
  },

  attachment(value: unknown): string[] {
    const attachmentError = getInvalidAttachment(value)
    if (attachmentError) {
      return [attachmentError.errorMessage]
    }
    return []
  },

  attachments(
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
  },

  numberRegex(value: unknown, formElement: FormTypes.NumberElement) {
    if (
      formElement.regexPattern &&
      typeof value === 'number' &&
      !Number.isNaN(value)
    ) {
      return validationExtensions.regex(value.toString(), formElement)
    }
    return []
  },

  nestedElements(
    value: unknown,
    {
      formElement,
      formElements,
      formElementsConditionallyShown,
      executedLookups,
      captchaType,
    }: {
      formElement: FormTypes.FormElementWithName
      formElements: FormTypes.FormElementWithName[] | undefined
      formElementsConditionallyShown: FormElementsConditionallyShown | undefined
      executedLookups: ExecutedLookups
      captchaType: CaptchaType
    },
  ) {
    if (formElements) {
      const executedLookupsValue =
        executedLookups !== undefined &&
        typeof executedLookups !== 'boolean' &&
        !Array.isArray(executedLookups)
          ? executedLookups[formElement.name]
          : {}
      const nestedExecutedLookups =
        executedLookupsValue !== undefined &&
        typeof executedLookupsValue !== 'boolean' &&
        !Array.isArray(executedLookupsValue)
          ? executedLookupsValue[formElement.name]
          : {}
      const formElementConditionallyShown =
        formElementsConditionallyShown?.[formElement.name]
      const errors = validateSubmission({
        elements: formElements as FormTypes.FormElementWithName[],
        submission: value as SubmissionTypes.S3SubmissionData['submission'],
        formElementsConditionallyShown:
          formElementConditionallyShown?.type === 'formElements'
            ? formElementConditionallyShown.formElements
            : undefined,
        executedLookups:
          typeof nestedExecutedLookups !== 'boolean' &&
          !Array.isArray(nestedExecutedLookups)
            ? nestedExecutedLookups
            : {},
        captchaType,
      })
      if (errors) {
        return {
          type: 'formElements' as const,
          formElements: errors,
        }
      }
    }
  },
}

export default validationExtensions
