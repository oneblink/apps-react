import 'validate.js'
import { ExecutedLookups } from './form'

declare module 'validate.js' {
  export interface ValidateOption {
    formElementsConditionallyShown:
      | import('@oneblink/sdk-core').conditionalLogicService.FormElementsConditionallyShown
      | undefined
    executedLookups: boolean | ExecutedLookups | ExecutedLookups[] | undefined
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
