import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import { formElementsService } from '@oneblink/sdk-core'
import useFormDefinition from './useFormDefinition'

export default function useFlattenElements(): FormTypes.FormElement[] {
  const definition = useFormDefinition()
  return React.useMemo(
    () => formElementsService.flattenFormElements(definition.elements),
    [definition.elements],
  )
}
