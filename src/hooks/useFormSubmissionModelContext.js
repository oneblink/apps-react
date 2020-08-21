// @flow

import * as React from 'react'

/* ::
export type FormSubmissionModelContextValue = (boolean) => {
  captchaTokens: string[],
  submission: $PropertyType<FormElementsCtrl, 'model'>,
}
*/

export const FormSubmissionModelContext /* : React.Context<FormSubmissionModelContextValue> */ = React.createContext(
  () => ({}),
)

export default function useFormSubmissionModel() {
  return React.useContext(FormSubmissionModelContext)
}
