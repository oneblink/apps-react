import { EnvironmentTypes, FormTypes, SubmissionTypes } from '@oneblink/types'
import getDateRangeConfiguration, {
  DateRangeConfigurationOptions,
} from '../getDateRangeConfiguration'
import {
  FormElementsConditionallyShown,
  FormElementsValidation,
} from '../../types/form'
import cleanFormSubmissionModel from '../cleanFormSubmissionModel'
import getRepeatableSetEntriesConfiguration from '../getRepeatableSetEntriesConfiguration'
import { attachmentsService } from '@oneblink/apps'
import { FormElementBinaryStorageValue } from '../../types/attachments'

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

export function getInvalidAttachment(
  value: unknown,
): attachmentsService.AttachmentError | undefined {
  if (
    value &&
    typeof value === 'object' &&
    'type' in value &&
    value.type === 'ERROR'
  ) {
    return value as attachmentsService.AttachmentError
  }
}

export function validateAttachments(
  value: FormElementBinaryStorageValue[] | undefined,
): string[] {
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
    return [`${invalidAttachmentNames.join(', ')} could not be uploaded.`]
  }
  return []
}

export const generateLookupValidationMessage = (
  lookupButtonConfig?: EnvironmentTypes.ButtonConfiguration,
) => {
  return lookupButtonConfig && lookupButtonConfig.label
    ? `${lookupButtonConfig.label} is required`
    : 'Lookup is required'
}
