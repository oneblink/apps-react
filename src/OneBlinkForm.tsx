import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import OneBlinkFormBase, {
  BaseProps,
  ControlledProps,
} from './OneBlinkFormBase'
import useFormSubmissionState from './hooks/useFormSubmissionState'
import { FormSubmissionModel } from './types/form'

const OneBlinkFormControlled = React.memo(function OneBlinkFormControlled(
  props: BaseProps & ControlledProps,
) {
  return <OneBlinkFormBase {...props} isReadOnly={false} />
})

type UncontrolledProps = {
  form: FormTypes.Form
  initialSubmission?: FormSubmissionModel
  resumeAtElement?: FormTypes.FormElement
}

const OneBlinkFormUncontrolled = React.memo(function OneBlinkFormUncontrolled({
  form,
  initialSubmission,
  resumeAtElement,
  ...props
}: BaseProps & UncontrolledProps) {
  const [{ definition, submission, lastElementUpdated }, setFormSubmission] =
    useFormSubmissionState(form, initialSubmission, resumeAtElement)
  return (
    <OneBlinkFormBase
      {...props}
      isReadOnly={false}
      definition={definition}
      submission={submission}
      setFormSubmission={setFormSubmission}
      lastElementUpdated={lastElementUpdated}
    />
  )
})

export { OneBlinkFormControlled, OneBlinkFormUncontrolled }
