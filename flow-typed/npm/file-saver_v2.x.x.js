// flow-typed signature: 60c2d5e89aac3ebcc8d96817cd1a0f4a
// flow-typed version: c6154227d1/file-saver_v2.x.x/flow_>=v0.104.x

declare function saveAs(
  data: Blob | File | string,
  filename?: string,
  options?: {| autoBom: boolean |}
): void;

declare module "file-saver" {
  declare module.exports: {
    [[call]]: typeof saveAs,
    saveAs: typeof saveAs,
    ...
  };
}
