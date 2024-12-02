import validate from './extensions'
import { ValidateJSSchema } from './schema'
import {
  CaptchaType,
  ExecutedLookupValue,
  FormElementsConditionallyShown,
  FormElementsValidation,
} from '../../types/form'
import { SubmissionTypes } from '@oneblink/types'

export default function validateSubmission(
  schema: ValidateJSSchema,
  submission: SubmissionTypes.S3SubmissionData['submission'] | undefined,
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
  executedLookups: ExecutedLookupValue,
  captchaType: CaptchaType,
): FormElementsValidation | undefined {
  const errorsAsArray = validate(submission, schema, {
    format: 'grouped',
    fullMessages: false,
    formElementsConditionallyShown,
    executedLookups,
    captchaType,
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
