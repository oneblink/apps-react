import * as React from 'react'
import {
  Attachment,
  StorageElement,
  AttachmentNew,
  AttachmentConfiguration,
} from './useAttachments'
import { submissionService, authService } from '@oneblink/apps'
import useFormDefinition from '../useFormDefinition'
import { useBooleanState } from '../..'

export type OnChange = (id: string, attachment: Attachment) => void

const getId = (attachment: Attachment): string => {
  if (!attachment.type) {
    return attachment.id
  }
  return attachment._id
}

const fetchFile = async (attachment: AttachmentConfiguration) => {
  const response = await fetch(
    attachment.url,
    attachment.isPrivate
      ? {
          headers: {
            Authorization: `Bearer ${await authService.getIdToken()}`,
          },
        }
      : undefined,
  )
  if (!response.ok) {
    throw new Error(
      `Unable to download file. HTTP Status Code: ${response.status}`,
    )
  }
  return await response.blob()
}

const useAttachment = (
  attachment: Attachment,
  element: StorageElement,
  onChange: OnChange,
) => {
  const isPrivate = element.storageType === 'private'
  const form = useFormDefinition()

  const [isLoadingAttachmentBlob, startLoading, stopLoading] = useBooleanState(
    false,
  )
  const [attachmentBlob, setAttachmentBlob] = React.useState<Blob>()

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

  const fetchAttachment = React.useCallback(
    async (attachment: AttachmentConfiguration) => {
      startLoading()
      try {
        const file = await fetchFile(attachment)
        setAttachmentBlob(file)
      } catch (err) {
        console.log('Error loading file:', err)
      }
      stopLoading()
    },
    [startLoading, stopLoading],
  )

  // TRIGGER UPLOAD
  React.useEffect(() => {
    if (attachment.type === 'NEW') {
      uploadAttachment(attachment)
    }
  }, [attachment, uploadAttachment])

  // TRIGGER DOWNLOAD
  React.useEffect(() => {
    if (!attachment.type && attachment.contentType.includes('image/')) {
      fetchAttachment(attachment)
    }
  }, [attachment, attachment.type, fetchAttachment])

  return {
    isLoadingAttachmentBlob,
    attachmentBlob,
  }
}

export default useAttachment
