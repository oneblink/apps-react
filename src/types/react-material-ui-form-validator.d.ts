// This is an override for the react-material-ui-form-validator lib.
// The `react-material-ui-form-validator` lib uses outdated material-ui types, so we have copied and modifed these from theirs.

declare module 'react-material-ui-form-validator' {
  export interface ValidatorFormProps {
    className?: string | undefined
    onSubmit: (event: React.FormEvent) => void
    instantValidate?: boolean | undefined
    onError?: ((errors: any[]) => void) | undefined
    debounceTime?: number | undefined
    [key: string]: any
  }
  export class ValidatorForm extends (await import('react'))
    .Component<ValidatorFormProps> {
    static addValidationRule(
      name: string,
      callback: (value: any) => boolean | Promise<boolean>,
    ): void
    static removeValidationRule(name: string): void
    static getValidator(
      name: string,
      value: unknown,
      required: boolean,
    ): boolean
    isFormValid(dryRun: boolean): Promise<boolean>
    resetValidations(): void
  }

  export interface ValidatorComponentProps {
    errorMessages?: any[] | string | undefined
    validators?: any[] | undefined
    name: string
    value: any
    validatorListener?: ((isValid: boolean) => void) | undefined
    withRequiredValidator?: boolean | undefined
    [key: string]: any
  }

  export class ValidatorComponent<T> extends (await import('react')).Component<
    ValidatorComponentProps & T,
    {
      isValid: boolean
    },
    {
      isValid: boolean
    }
  > {
    getErrorMessage(): string | boolean
    isValid(): boolean
    makeInvalid(): void
    makeValid(): void
    validate(value: string, includeRequired?: boolean, dryRun?: boolean): void
  }
  export class TextValidator extends (await import('react')).Component<
    ValidatorComponentProps & import('@mui/material').TextFieldProps
  > {
    getErrorMessage(): string | boolean
    isValid(): boolean
    makeInvalid(): void
    makeValid(): void
    validate(value: string, includeRequired?: boolean, dryRun?: boolean): void
  }
  export class SelectValidator extends (await import('react')).Component<
    ValidatorComponentProps & import('@mui/material').TextFieldProps
  > {
    getErrorMessage(): string | boolean
    isValid(): boolean
    makeInvalid(): void
    makeValid(): void
    validate(value: string, includeRequired?: boolean, dryRun?: boolean): void
  }
}
