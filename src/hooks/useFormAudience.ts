import { FormTypes } from '@oneblink/types'
import * as React from 'react'

export const FormAudienceContext =
  React.createContext<FormTypes.FormElementHiddenFromAudience>('SUBMITTER')

export default function useFormAudience() {
  return React.useContext(FormAudienceContext)
}
