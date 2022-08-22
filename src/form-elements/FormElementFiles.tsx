import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import Files from '../components/renderer/attachments/Files'
import FormElementFile from './FormElementFile'
import useAttachments from '../hooks/attachments/useAttachments'
import {
  checkFileNameIsValid,
  checkFileNameExtensionIsValid,
} from '../services/form-validation'
import { Attachment } from '../types/attachments'
import { FormElementValueChangeHandler } from '../types/form'

export function stringifyAttachments(value: Attachment[] | undefined): string {
  if (value?.every((attachment) => !attachment.type)) {
    return JSON.stringify(value)
  }
  return ''
}

function FormElementFiles({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: {
  id: string
  element: FormTypes.FilesElement
  value?: Attachment[]
  onChange: FormElementValueChangeHandler<Attachment[]>
  displayValidationMessage: boolean
  validationMessage: string | undefined
}) {
  const { isDirty, addAttachments, removeAttachment, changeAttachment } =
    useAttachments(element, onChange)

  const attachments = value || []

  const handleRenderAttachment = React.useCallback(
    (attachment, index) => {
      return (
        <FormElementFile
          key={index}
          element={element}
          onRemove={removeAttachment}
          file={attachment}
          onChange={changeAttachment}
          disableUpload={
            (!!element.maxEntries && attachments.length > element.maxEntries) ||
            !checkFileNameIsValid(element, attachment.fileName) ||
            !checkFileNameExtensionIsValid(element, attachment.fileName)
          }
        />
      )
    },
    [attachments.length, changeAttachment, element, removeAttachment],
  )

  return (
    <Files
      id={id}
      isDirty={isDirty}
      element={element}
      attachments={attachments}
      displayValidationMessage={displayValidationMessage}
      validationMessage={validationMessage}
      onAddFiles={addAttachments}
      onRenderAttachment={handleRenderAttachment}
    />
  )
}

export default React.memo(FormElementFiles)
