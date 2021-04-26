import * as React from 'react'

import { FormTypes, SubmissionTypes } from '@oneblink/types'

import OneBlinkFormBase from './OneBlinkFormBase'

type Props = {
  form: FormTypes.Form
  disabled?: boolean
  isPreview?: boolean
  initialSubmission?: FormElementsCtrl['model'] | null
  googleMapsApiKey?: string
  captchaSiteKey?: string
  onCancel: () => unknown
  onSubmit: (newFormSubmission: SubmissionTypes.NewFormSubmission) => unknown
  onSaveDraft?: (
    newDraftSubmission: SubmissionTypes.NewDraftSubmission,
  ) => unknown
  onChange?: (model: FormElementsCtrl['model']) => unknown
}

function OneBlinkForm({
  googleMapsApiKey,
  captchaSiteKey,
  form,
  disabled,
  isPreview,
  initialSubmission,
  onCancel,
  onSubmit,
  onSaveDraft,
  onChange,
}: Props) {
  return (
    <OneBlinkFormBase
      form={form}
      disabled={disabled}
      isPreview={isPreview}
      googleMapsApiKey={googleMapsApiKey}
      initialSubmission={initialSubmission}
      captchaSiteKey={captchaSiteKey}
      isReadOnly={false}
      onCancel={onCancel}
      onSubmit={onSubmit}
      onSaveDraft={onSaveDraft}
      onChange={onChange}
    />
  )
}

export default React.memo(OneBlinkForm)
