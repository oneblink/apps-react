// flow-typed signature: 72d0397901ea720321f024742cd0d135
// flow-typed version: c6154227d1/clsx_v1.x.x/flow_>=v0.104.x

declare module 'clsx' {
  declare type Classes = 
    | Array<Classes>
    | { [className: string]: *, ... }
    | string
    | number
    | boolean
    | void
    | null;

  declare module.exports: (...classes: Array<Classes>) => string;
}
