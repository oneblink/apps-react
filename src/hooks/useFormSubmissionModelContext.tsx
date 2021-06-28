import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import cleanFormElementsCtrlModel from '../services/cleanFormSubmissionModel'

export type FormSubmissionModelContextValue = FormSubmissionModel

const FormSubmissionModelContext =
  React.createContext<FormSubmissionModelContextValue>({})

export function FormSubmissionModelContextProvider({
  children,
  model,
  elements,
  formElementsConditionallyShown,
}: {
  model: FormSubmissionModel
  elements: FormTypes.FormElement[] | undefined
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  children: React.ReactNode
}) {
  const value = React.useMemo(() => {
    return cleanFormElementsCtrlModel(
      model,
      elements || [],
      formElementsConditionallyShown,
      true,
    ).model
  }, [formElementsConditionallyShown, elements, model])
  return (
    <FormSubmissionModelContext.Provider value={value}>
      {children}
    </FormSubmissionModelContext.Provider>
  )
}

export default function useFormSubmissionModel() {
  return React.useContext(FormSubmissionModelContext)
}
