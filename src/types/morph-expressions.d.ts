declare module 'morph-expressions' {
  /**
   * Registered functions are called with the evaluated argument expressions
   * (`operator.apply(undefined, args)` in the AST). Argument count and types
   * are not fixed by the library, so `registerFunction` is generic over the
   * handler's parameter list.
   */
  type FunctionHandler<TArgs extends unknown[] = unknown[]> = (
    ...args: TArgs
  ) => unknown

  type PropertyHandler<TScope> = (scope: TScope) => unknown

  interface ParsedExpression<TScope> {
    identifiers: string[]
    eval: (scope?: TScope) => unknown
  }

  export default class ExpressionParser<TScope> {
    registerFunction<TArgs extends unknown[]>(
      name: string,
      handler: FunctionHandler<TArgs>,
    ): void
    unRegisterFunction(name: string): void
    registerProperty(name: string, handler: PropertyHandler<TScope>): void
    unRegisterProperty(name: string): void
    parse(expression: string): ParsedExpression<TScope>
    parseAndEval(expression: string, scope?: TScope): unknown
  }
}
