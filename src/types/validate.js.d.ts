import 'validate.js'

declare module 'validate.js' {
  export interface ValidateOption {
    formElementsConditionallyShown:
      | import('@oneblink/sdk-core').conditionalLogicService.FormElementsConditionallyShown
      | undefined
  }

  export interface ValidatorConstraintFn<
    T extends Record<string, unknown> | undefined,
    V = unknown,
  > {
    (
      value: V,
      attributes: T,
      attributeName: string,
      options: ValidateOption,
    ): unknown
  }
}
