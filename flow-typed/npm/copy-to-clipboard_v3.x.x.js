// flow-typed signature: c1f2b39bd117c20d14e291aecccfdff9
// flow-typed version: c6154227d1/copy-to-clipboard_v3.x.x/flow_>=v0.104.x

declare module 'copy-to-clipboard' {
  declare export type Options = {|
    debug?: boolean,
    message?: string,
  |};

  declare module.exports: (text: string, options?: Options) => boolean;
}
