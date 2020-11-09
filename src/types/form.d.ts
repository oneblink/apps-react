import { FormTypes } from '@oneblink/apps'

export interface FormElementsCtrl {
  model: { [property: string]: unknown }
  elements: FormTypes.FormElement[]
  parentFormElementsCtrl?: FormElementsCtrl
}

export type FormElementValidation =
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

export interface FormElementsValidation {
  [formElementName: string]: FormElementValidation | undefined
}

export interface PageElementsValidation {
  [pageElementId: string]: FormElementsValidation | undefined
}

interface PageConditionallyShown {
  type: 'page'
  isShown: boolean
  formElements: FormElementsConditionallyShown
}

export interface FormElementsConditionallyShown {
  [formElementName: string]: FormElementConditionallyShown | undefined
}

export type FormElementConditionallyShown =
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

export interface PageElementsConditionallyShown {
  [pageElementId: string]: PageConditionallyShown
}
