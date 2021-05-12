import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import {
  prepareNewAttachment,
  correctFileOrientation,
} from '../../services/attachments'
import { Attachment, AttachmentNew } from '../../types/attachments'
import { canvasToBlob } from '../../services/blob-utils'

const useAttachments = (
  element: FormTypes.FilesElement,
  onChange: FormElementValueChangeHandler<Attachment[]>,
) => {
  const addAttachments = React.useCallback(
    async (files: File[]): Promise<void> => {
      if (!files.length) return
      const newAttachments: AttachmentNew[] = await Promise.all(
        files.map(async (file) => {
          const result = await correctFileOrientation(file)
          if (result instanceof Blob) {
            return prepareNewAttachment(result, file.name, element)
          }

          const blob = await canvasToBlob(result)
          return prepareNewAttachment(blob, file.name, element)
        }),
      )

      onChange(element, (currentAttachments) => {
        if (!currentAttachments) return newAttachments
        return [...currentAttachments, ...newAttachments]
      })
    },
    [element, onChange],
  )

  const removeAttachment = React.useCallback(
    (id: string) => {
      onChange(element, (currentAttachments) => {
        if (!currentAttachments) return
        return currentAttachments.filter((att) => {
          // Return items that are not the removed id
          if (!att.type) {
            return att.id !== id
          }
          return att._id !== id
        })
      })
    },
    [element, onChange],
  )

  const changeAttachment = React.useCallback(
    (id: string, attachment: Attachment) => {
      onChange(element, (currentAttachments) => {
        if (!currentAttachments) return
        return currentAttachments.map((att) => {
          // Can only change attachments that are not uploaded (have a type)
          if (att.type && att._id === id) {
            return attachment
          }
          return att
        })
      })
    },
    [element, onChange],
  )

  const clearInvalidAttachments = React.useCallback(() => {
    onChange(element, (currentAttachments) => {
      if (!currentAttachments) return
      return currentAttachments.filter((att) => {
        return att.type !== 'ERROR'
      })
    })
  }, [element, onChange])

  return {
    addAttachments,
    removeAttachment,
    changeAttachment,
    clearInvalidAttachments,
  }
}

export default useAttachments
