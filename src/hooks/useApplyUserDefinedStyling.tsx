import * as React from 'react'
import {
  GenericCssMappings,
  makeCssFromCssMappings,
} from '../services/styling-engine'

const useApplyUserDefinedStyling = <T extends object>(
  styling: T | undefined,
  applyCssMappings: (styling: T) => GenericCssMappings,
) => {
  React.useEffect(() => {
    if (styling) {
      const cssMappings = applyCssMappings(styling)
      const css = makeCssFromCssMappings(cssMappings)

      if (css) {
        console.log('Applying user defined styling...', styling)
        const style = document.createElement('style')
        style.appendChild(document.createTextNode(css))
        document.head.appendChild(style)
        return () => {
          console.log('Removing user defined styling...', styling)
          document.head.removeChild(style)
        }
      }
    }
  }, [styling, applyCssMappings])
}

export default useApplyUserDefinedStyling
