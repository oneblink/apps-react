import { FormTypes, SubmissionTypes, IntegrationTypes } from '@oneblink/types'

export {
  FormElementConditionallyShownElement,
  FormElementConditionallyShown,
  FormElementsConditionallyShown,
} from '@oneblink/sdk-core/dist/conditionalLogicService'

export type FormElementKey = string
export type RepeatableSetEntryIndex = string

export type FormElementsValidation = Record<
  FormElementKey,
  FormElementValidation
>

export type FormElementValidation =
  | undefined
  | string
  | {
      type: 'formElements'
      formElements: FormElementsValidation | undefined
    }
  | {
      type: 'repeatableSet'
      set: string | undefined
      entries: Record<
        RepeatableSetEntryIndex,
        FormElementsValidation | undefined
      >
    }

export type ExecutedLookups =
  | {
      [elementName: string]:
        | boolean
        | ExecutedLookups
        | ExecutedLookups[]
        | undefined
    }
  | undefined

export type ExecutedLookupValue = NonNullable<ExecutedLookups>[string]

type ValueChangeHandler<U extends Record<string, unknown>> = (
  element: FormTypes.FormElement,
  opts: U,
) => void

export type FormElementValueChangeHandler<T = unknown> = ValueChangeHandler<{
  value?: T | ((existingValue?: T) => T | undefined)
}>

export type NestedFormElementValueChangeHandler<T = unknown> =
  ValueChangeHandler<{
    value?: T | ((existingValue?: T) => T | undefined)
    executedLookups:
      | ExecutedLookupValue
      | ((currentExecutedLookups: ExecutedLookupValue) => ExecutedLookupValue)
  }>

export type FormElementLookupHandler = (
  setter: (data: {
    submission: SubmissionTypes.S3SubmissionData['submission']
    elements: FormTypes.FormElement[]
    lastElementUpdated: FormTypes.FormElement | undefined
    executedLookups: ExecutedLookups
  }) => {
    submission: SubmissionTypes.S3SubmissionData['submission']
    elements: FormTypes.FormElement[]
    executedLookups: ExecutedLookups
  },
) => void
export type UpdateFormElementsHandler = (
  setter: (element: FormTypes.FormElement[]) => FormTypes.FormElement[],
) => void

export type SetFormSubmission = React.Dispatch<
  React.SetStateAction<{
    definition: FormTypes.Form
    submission: SubmissionTypes.S3SubmissionData['submission']
    lastElementUpdated: FormTypes.FormElement | undefined
    executedLookups: ExecutedLookups
  }>
>

export type IsDirtyProps = {
  isDirty: boolean
  setIsDirty: () => void
}

export type CaptchaType = NonNullable<
  IntegrationTypes.IntegrationRecaptcha['configuration']['domains'][number]['type']
>
