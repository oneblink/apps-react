import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import flattenFormElements from '../services/flattenFormElements'
import useFormDefinition from './useFormDefinition'

export default function useFlattenElements(): FormTypes.FormElement[] {
  const definition = useFormDefinition()
  return React.useMemo(
    () => flattenFormElements(definition.elements),
    [definition.elements],
  )
}
