import * as React from 'react'
import { Attachment, StorageElement, AttachmentNew } from './useAttachments'
import { submissionService } from '@oneblink/apps'
import useFormDefinition from '../useFormDefinition'

export type OnChange = (id: string, attachment: Attachment) => void

const getId = (attachment: Attachment): string => {
  if (!attachment.type) {
    return attachment.id
  }
  return attachment._id
}
const useAttachment = (
  attachment: Attachment,
  element: StorageElement,
  onChange: OnChange,
) => {
  const isPrivate = element.storageType === 'private'
  const form = useFormDefinition()

  const uploadAttachment = React.useCallback(
    async (newAttachment: AttachmentNew) => {
      if (!form) return
      const id = getId(newAttachment)
      try {
        console.log(
          'Attempting to upload attachment...',
          newAttachment.fileName,
        )

        // UPDATE TO SAVING
        onChange(id, {
          ...newAttachment,
          type: 'SAVING',
        })

        const upload = await submissionService.uploadAttachment({
          formId: form.id,
          file: {
            name: newAttachment.fileName,
            type: newAttachment.data.type,
            data: newAttachment.data,
            isPrivate,
          },
        })
        console.log('Successfully Uploaded attachment!', newAttachment.fileName)

        // UPDATE ATTACHMENT
        onChange(id, upload)
      } catch (error) {
        console.log('Failed to upload attachment...', {
          name: newAttachment.fileName,
          error,
        })
        onChange(id, {
          ...newAttachment,
          type: 'ERROR',
        })
      }
    },
    [form, isPrivate, onChange],
  )

  React.useEffect(() => {
    if (attachment.type === 'NEW') {
      uploadAttachment(attachment)
    }
  }, [attachment, uploadAttachment])
}

export default useAttachment
