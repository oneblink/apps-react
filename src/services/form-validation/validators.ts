import { FormTypes, SubmissionTypes } from '@oneblink/types'
import getDateRangeConfiguration, {
  DateRangeConfigurationOptions,
} from '../getDateRangeConfiguration'
import {
  FormElementsConditionallyShown,
  FormElementsValidation,
} from '../../types/form'
import cleanFormSubmissionModel from '../cleanFormSubmissionModel'
import getRepeatableSetEntriesConfiguration from '../getRepeatableSetEntriesConfiguration'

export const presence = (
  { required, requiredMessage }: FormTypes.FormElementRequired,
  message: string,
) => (required ? { message: requiredMessage || message } : false)

export const escapeElementName = (elementName: string) => {
  const escapedName = elementName.replace(/\./g, '\\.')
  return escapedName
}

export function getCustomRegexFormatConfig<DefaultValue>(
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

export function getCleanDateRangeConfiguration(
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

export function getCleanRepeatableSetConfiguration(
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
