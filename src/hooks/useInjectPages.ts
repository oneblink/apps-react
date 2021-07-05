import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import { FormSubmissionModel } from '../types/form'

type InjectPagesContextValue = (
  lookupFormElement: FormTypes.LookupFormElement,
  pageElements: FormTypes.PageElement[],
  data?: FormSubmissionModel,
) => void

export const InjectPagesContext = React.createContext<InjectPagesContextValue>(
  () => {},
)

export default function useInjectPages() {
  return React.useContext(InjectPagesContext)
}
