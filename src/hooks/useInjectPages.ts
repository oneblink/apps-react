import { FormTypes, SubmissionTypes } from '@oneblink/types'
import * as React from 'react'
import { SetFormSubmissionOptions } from '../types/form'

type InjectPagesContextValue = (
  lookupFormElement: FormTypes.LookupFormElement,
  pageElements: FormTypes.PageElement[],
  data: SubmissionTypes.S3SubmissionData['submission'] | undefined,
  options: SetFormSubmissionOptions,
) => void

export const InjectPagesContext = React.createContext<InjectPagesContextValue>(
  () => {},
)

export default function useInjectPages() {
  return React.useContext(InjectPagesContext)
}
