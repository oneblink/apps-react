// eslint-disable-next-line @typescript-eslint/no-unused-vars

type FormElementKey = string
type RepeatableSetEntryIndex = string

declare type FormSubmissionModel = Record<FormElementKey, unknown>

declare type FormElementsValidation = Record<
  FormElementKey,
  FormElementValidation
>

declare type FormElementValidation =
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

declare type FormElementsConditionallyShown = Record<
  FormElementKey,
  FormElementConditionallyShown
>

declare type FormElementConditionallyShown =
  | undefined
  | {
      type: 'formElement'
      isHidden: boolean
      options?: import('@oneblink/types').FormTypes.ChoiceElementOption[]
    }
  | {
      type: 'formElements'
      isHidden: boolean
      formElements: FormElementsConditionallyShown | undefined
    }
  | {
      type: 'repeatableSet'
      isHidden: boolean
      entries: Record<
        RepeatableSetEntryIndex,
        FormElementsConditionallyShown | undefined
      >
    }

declare type FormElementValueChangeHandler<T = unknown> = (
  element: import('@oneblink/types').FormTypes.FormElement,
  value?: T | ((existingValue?: T) => T | undefined),
) => void

declare type FormElementLookupHandler = (
  setter: (data: {
    submission: FormSubmissionModel
    elements: import('@oneblink/types').FormTypes.FormElement[]
  }) => {
    submission: FormSubmissionModel
    elements: import('@oneblink/types').FormTypes.FormElement[]
  },
) => void

declare type SetFormSubmission = React.Dispatch<
  React.SetStateAction<{
    definition: import('@oneblink/types').FormTypes.Form
    submission: FormSubmissionModel
  }>
>
