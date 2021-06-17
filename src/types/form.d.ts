// eslint-disable-next-line @typescript-eslint/no-unused-vars

// type PageElementId = string
type FormElementKey = string
type RepeatableSetEntryIndex = string

declare type FormElementsCtrl = {
  model: Record<FormElementKey, unknown>
  elements: import('@oneblink/types').FormTypes.FormElement[]
  parentFormElementsCtrl?: FormElementsCtrl
}

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
      isShown: boolean
    }
  | {
      type: 'formElements'
      isShown: boolean
      formElements: FormElementsConditionallyShown | undefined
    }
  | {
      type: 'repeatableSet'
      isShown: boolean
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
    submission: FormElementsCtrl['model']
    elements: import('@oneblink/types').FormTypes.FormElement[]
  }) => {
    submission: FormElementsCtrl['model']
    elements: import('@oneblink/types').FormTypes.FormElement[]
  },
) => void
