import { FormTypes } from '@oneblink/types'

export {
  FormElementConditionallyShownElement,
  FormElementConditionallyShown,
  FormElementsConditionallyShown,
} from '@oneblink/sdk-core/dist/conditionalLogicService'

export type FormElementKey = string
export type RepeatableSetEntryIndex = string

export type FormSubmissionModel = Record<FormElementKey, unknown>

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
  value?: T | ((existingValue?: T) => T | undefined),
) => void

export type FormElementLookupHandler = (
  setter: (data: {
    submission: FormSubmissionModel
    elements: FormTypes.FormElement[]
    lastElementUpdated: FormTypes.FormElement | undefined
  }) => {
    submission: FormSubmissionModel
    elements: FormTypes.FormElement[]
  },
) => void

export type SetFormSubmission = React.Dispatch<
  React.SetStateAction<{
    definition: FormTypes.Form
    submission: FormSubmissionModel
    lastElementUpdated: FormTypes.FormElement | undefined
  }>
>

export type IsDirtyProps = {
  isDirty: boolean
  setIsDirty: () => void
}
