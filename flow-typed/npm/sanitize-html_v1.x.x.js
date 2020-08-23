// flow-typed signature: b2befe333059a2207f4fdda5de472ed7
// flow-typed version: c6154227d1/sanitize-html_v1.x.x/flow_>=v0.104.x

declare module "sanitize-html" {
  declare type Frame = {
    tag: string,
    attribs: Object,
    text: string,
    tagPosition: number,
    ...
  };
  declare type SanitizeOptions = {
    allowedTags?: Array<string> | false,
    allowedAttributes?: { [key: string]: Array<string>, ... }[] | Object | false,
    transformTags?: { [key: string]:
      | string
      | ((
          tagName: string,
          attribs: Object
        ) => {
      tagName: string,
      attribs: Object,
      ...
    }), ... },
    exclusiveFilter?: (frame: Frame) => boolean,
    textFilter?: (text: string) => string,
    allowedClasses?: { [key: string]: Array<string>, ... },
    allowedSchemes?: Array<string> | { [key: string]: Array<string>, ... },
    nonTextTags?: Array<string>,
    parser?: $Shape<{
      xmlMode: boolean,
      lowerCaseTags: boolean,
      lowerCaseAttributeNames: boolean,
      recognizeCDATA: boolean,
      recognizeSelfClosing: boolean,
      ...
    }>,
    ...
  };
  declare module.exports: (dirty: string, options?: SanitizeOptions) => string;
}
