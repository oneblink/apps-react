import { FormTypes } from '@oneblink/types'
import { FormElement } from '@oneblink/types/typescript/forms'
import * as React from 'react'
import cleanFormSubmissionModel from '../services/cleanFormSubmissionModel'
import {
  FormElementsConditionallyShown,
  FormSubmissionModel,
} from '../types/form'

export type FormSubmissionModelContextValue = {
  formSubmissionModel: FormSubmissionModel
  parent?: FormSubmissionModelContextValue
  elements: FormElement[]
}

const FormSubmissionModelContext = React.createContext<
  FormSubmissionModelContextValue | undefined
>(undefined)

export function FormSubmissionModelContextProvider({
  children,
  model,
  elements,
  formElementsConditionallyShown,
}: {
  model: FormSubmissionModel
  elements: FormTypes.FormElement[]
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  children: React.ReactNode
}) {
  const formSubmissionModelContext = React.useContext(
    FormSubmissionModelContext,
  )
  const value = React.useMemo(() => {
    return {
      formSubmissionModel: cleanFormSubmissionModel(
        model,
        elements,
        formElementsConditionallyShown,
        true,
      ).model,
      parent: formSubmissionModelContext,
      elements,
    }
  }, [
    model,
    elements,
    formElementsConditionallyShown,
    formSubmissionModelContext,
  ])
  return (
    <FormSubmissionModelContext.Provider value={value}>
      {children}
    </FormSubmissionModelContext.Provider>
  )
}

export default function useFormSubmissionModel() {
  const formSubmissionModelContext = React.useContext(
    FormSubmissionModelContext,
  )
  if (!formSubmissionModelContext) {
    throw new Error(
      '"FormSubmissionModelContext" does not have a value in this context',
    )
  }
  return formSubmissionModelContext
}

export function useFormSubmissionModelParent() {
  let formSubmissionModelContext = useFormSubmissionModel()
  while (formSubmissionModelContext.parent) {
    formSubmissionModelContext = formSubmissionModelContext.parent
  }
  return formSubmissionModelContext
}
