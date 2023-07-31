import { FormTypes, SubmissionTypes } from '@oneblink/types'

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

export type FormElementValueChangeHandler<T = unknown> = (
  element: FormTypes.FormElement,
  {
    value,
    executedLookups,
  }: {
    value?: T | ((existingValue?: T) => T | undefined)
    executedLookups?:
      | ExecutedLookups
      | ((currentExecutedLookups: ExecutedLookups) => ExecutedLookups)
  },
) => void

export type ExecutedLookups = {
  [elementName: string]: boolean | ExecutedLookups | Array<ExecutedLookups>
}

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
