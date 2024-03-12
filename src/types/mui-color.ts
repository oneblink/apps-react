import { Palette, PaletteColor } from '@mui/material'

export type Color = keyof {
  [T in keyof Palette as Palette[T] extends PaletteColor ? T : never]: unknown
}
