import * as React from 'react'

export type FormSubmissionModelContextValue = (
  value: boolean,
) => {
  captchaTokens: string[]
  submission: FormElementsCtrl['model']
}

export const FormSubmissionModelContext = React.createContext<
  FormSubmissionModelContextValue
>(() => ({
  captchaTokens: [],
  submission: {},
}))

export default function useFormSubmissionModel() {
  return React.useContext(FormSubmissionModelContext)
}
