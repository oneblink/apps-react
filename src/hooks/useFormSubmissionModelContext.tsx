import * as React from 'react'
import cleanFormElementsCtrlModel from '../services/clean-form-elements-ctrl-model'

export type FormSubmissionModelContextValue = FormElementsCtrl['model']

const FormSubmissionModelContext =
  React.createContext<FormSubmissionModelContextValue>({})

export function FormSubmissionModelContextProvider({
  children,
  formElementsCtrl,
  formElementsConditionallyShown,
}: {
  formElementsCtrl: FormElementsCtrl
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  children: React.ReactNode
}) {
  const value = React.useMemo(() => {
    return cleanFormElementsCtrlModel(
      formElementsCtrl,
      formElementsConditionallyShown,
      true,
    ).model
  }, [formElementsConditionallyShown, formElementsCtrl])
  return (
    <FormSubmissionModelContext.Provider value={value}>
      {children}
    </FormSubmissionModelContext.Provider>
  )
}

export default function useFormSubmissionModel() {
  return React.useContext(FormSubmissionModelContext)
}
