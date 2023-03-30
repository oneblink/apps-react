// eslint-disable-next-line @typescript-eslint/no-unused-vars

type FormElementKey = string
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

export type FormElementsConditionallyShown = Record<
  FormElementKey,
  FormElementConditionallyShown
>

export type FormElementConditionallyShownElement = {
  type: 'formElement'
  isHidden: boolean
  options?: import('@oneblink/types').FormTypes.ChoiceElementOption[]
  dependencyIsLoading?: boolean
}
export type FormElementConditionallyShown =
  | undefined
  | FormElementConditionallyShownElement
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

export type FormElementValueChangeHandler<T = unknown> = (
  element: import('@oneblink/types').FormTypes.FormElement,
  value?: T | ((existingValue?: T) => T | undefined),
) => void

export type FormElementLookupHandler = (
  setter: (data: {
    submission: FormSubmissionModel
    elements: import('@oneblink/types').FormTypes.FormElement[]
    lastElementUpdated:
      | import('@oneblink/types').FormTypes.FormElement
      | undefined
  }) => {
    submission: FormSubmissionModel
    elements: import('@oneblink/types').FormTypes.FormElement[]
  },
) => void

export type SetFormSubmission = React.Dispatch<
  React.SetStateAction<{
    definition: import('@oneblink/types').FormTypes.Form
    submission: FormSubmissionModel
    lastElementUpdated:
      | import('@oneblink/types').FormTypes.FormElement
      | undefined
  }>
>

export type IsDirtyProps = {
  isDirty: boolean
  setIsDirty: () => void
}
