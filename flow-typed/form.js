// @flow

declare type FormElementsCtrl = {
  model: { +[string]: mixed },
  elements: FormElement[],
  parentFormElementsCtrl?: FormElementsCtrl,
}

declare type FormElementValidation =
  | string
  | void
  | {
      type: 'repeatableSet',
      set: string | void,
      entries: {
        [index: string]: FormElementsValidation | void,
      },
    }
  | {
      type: 'nestedForm',
      nested: FormElementsValidation,
    }

declare type FormElementsValidation = {
  [formElementName: string]: FormElementValidation | void,
}

declare type PageElementsValidation = {
  [pageElementId: string]: FormElementsValidation | void,
}

type PageConditionallyShown = {
  type: 'page',
  isShown: boolean,
  formElements: FormElementsConditionallyShown,
}

declare type FormElementsConditionallyShown = {
  [formElementName: string]: FormElementConditionallyShown | void,
}

declare type FormElementConditionallyShown =
  | {
      type: 'formElement',
      isShown: boolean,
    }
  | PageConditionallyShown
  | {
      type: 'repeatableSet',
      isShown: boolean,
      entries: {
        [index: string]: FormElementsConditionallyShown | void,
      },
    }
  | {
      type: 'nestedForm',
      isShown: boolean,
      nested: FormElementsConditionallyShown,
    }

declare type PageElementsConditionallyShown = {
  [pageElementId: string]: PageConditionallyShown,
}
