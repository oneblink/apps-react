import * as React from 'react'
import Color from 'color'

const black = '#000000'
const white = '#FFFFFF'
export default (colorToGetContrastFor?: string) => {
  return React.useMemo(() => {
    if (!colorToGetContrastFor) return white
    const color = Color(colorToGetContrastFor)
    return color.isLight() ? black : white
  }, [colorToGetContrastFor])
}
