import * as React from 'react'

import OneBlinkFormBase, {
  Props,
  OptionalHandlerProps,
} from './OneBlinkFormBase'

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
  buttons,
}: Props & Required<OptionalHandlerProps>) {
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
      buttons={buttons}
    />
  )
}

export default React.memo(OneBlinkForm)
