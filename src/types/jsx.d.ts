import type { HTMLAttributes } from 'react'

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'on-loading': HTMLAttributes<HTMLElement>
    }
  }
}
