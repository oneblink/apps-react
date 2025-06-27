import { FormTypes, SubmissionTypes, IntegrationTypes } from '@oneblink/types'
import { NewS3SubmissionData } from '@oneblink/types/typescript/submissions'

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
  idPrefix?: string,
) => void

export type FormElementValueChangeHandler<T = unknown> = ValueChangeHandler<{
  value?: T | ((existingValue?: T) => T | undefined)
}>

export type SectionState = NewS3SubmissionData['sectionState']

export type NestedFormElementValueChangeHandler<T = unknown> =
  ValueChangeHandler<{
    value?: T | ((existingValue?: T) => T | undefined)
    executedLookups:
      | ExecutedLookupValue
      | ((currentExecutedLookups: ExecutedLookupValue) => ExecutedLookupValue)
    deleteSection?: boolean
    sectionState: SectionState | ((currentSectionState: SectionState) => SectionState)
  }>


export type FormElementLookupHandler = (
  setter: (data: {
    submission: SubmissionTypes.S3SubmissionData['submission']
    elements: FormTypes.FormElement[]
    lastElementUpdated: FormTypes.FormElement | undefined
    executedLookups: ExecutedLookups
    sectionState: SectionState | undefined
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
    sectionState: SectionState | undefined
  }>
>

export type IsDirtyProps = {
  isDirty: boolean
  setIsDirty: () => void
}

export type CaptchaType = NonNullable<
  IntegrationTypes.IntegrationRecaptcha['configuration']['domains'][number]['type']
>
