// flow-typed signature: 83621a559d1d59b6a3df4257ed0dc4e2
// flow-typed version: 9899c09849/dotenv_v8.x.x/flow_>=v0.53.x

// @flow

declare module 'dotenv' {
  declare type ParseResult = {| [key: string]: string |};
  declare type ConfigResult = {| parsed: ParseResult |} | {| error: Error |};
  declare function config(
    options?: $Shape<{| path: string, encoding: string, debug: boolean |}>
  ): ConfigResult;

  declare function parse(
    buffer: Buffer | string,
    options?: $Shape<{| debug: boolean |}>
  ): ParseResult;

  declare module.exports: {|
    config: typeof config,
    parse: typeof parse,
  |};
}

// eslint-disable-next-line no-empty
declare module 'dotenv/config' {
}
