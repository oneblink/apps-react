// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare type FormElementsCtrl = {
  model: { [property: string]: unknown }
  elements: import('@oneblink/types').FormTypes.FormElement[]
  parentFormElementsCtrl?: FormElementsCtrl
}

declare type FormElementValidation =
  | string
  | undefined
  | {
      type: 'repeatableSet'
      set: string | undefined
      entries: {
        [index: string]: FormElementsValidation | undefined
      }
    }
  | {
      type: 'nestedForm'
      nested: FormElementsValidation
    }

declare type FormElementsValidation = {
  [formElementName: string]: FormElementValidation | undefined
}

declare type PageElementsValidation = {
  [pageElementId: string]: FormElementsValidation | undefined
}

interface PageConditionallyShown {
  type: 'page'
  isShown: boolean
  formElements: FormElementsConditionallyShown
}

declare type FormElementsConditionallyShown = {
  [formElementName: string]: FormElementConditionallyShown | undefined
}

declare type FormElementConditionallyShown =
  | {
      type: 'formElement'
      isShown: boolean
    }
  | PageConditionallyShown
  | {
      type: 'repeatableSet'
      isShown: boolean
      entries: {
        [index: string]: FormElementsConditionallyShown | undefined
      }
    }
  | {
      type: 'nestedForm'
      isShown: boolean
      nested: FormElementsConditionallyShown
    }

declare type PageElementsConditionallyShown = {
  [pageElementId: string]: PageConditionallyShown
}
