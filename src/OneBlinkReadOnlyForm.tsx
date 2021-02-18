import * as React from 'react'

import { FormTypes } from '@oneblink/types'

import OneBlinkFormBase from './OneBlinkFormBase'

type Props = {
  form: FormTypes.Form
  initialSubmission?: FormElementsCtrl['model'] | null
  googleMapsApiKey?: string
  onFormError:() => unknown
}

function OneBlinkFormReadOnly({
  googleMapsApiKey,
  form,
  initialSubmission,
  onFormError,
}: Props) {

  return (
    <OneBlinkFormBase
      form={form}
      disabled={true}
      googleMapsApiKey={googleMapsApiKey}
      initialSubmission={initialSubmission}
      isReadOnly={true}
      onCloseConditionalLogicErrorModal={onFormError}
    />
  )
}

export default React.memo(OneBlinkFormReadOnly)
