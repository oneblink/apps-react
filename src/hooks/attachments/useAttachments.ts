import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import {
  prepareNewAttachment,
  generateErrorAttachment,
  correctFileOrientation,
} from '../../services/attachments'
import { attachmentsService } from '@oneblink/apps'
import { canvasToBlob } from '../../services/blob-utils'
import useIsMounted from '../useIsMounted'
import { FormElementValueChangeHandler, IsDirtyProps } from '../../types/form'

const useAttachments = (
  element: FormTypes.FilesElement,
  onChange: FormElementValueChangeHandler<attachmentsService.Attachment[]>,
  setIsDirty: IsDirtyProps['setIsDirty'],
  maxFileSize: number | undefined,
) => {
  const isMounted = useIsMounted()

  const addAttachments = React.useCallback(
    async (files: File[]): Promise<void> => {
      if (!files.length) return
      const newAttachments: Array<
        attachmentsService.AttachmentNew | attachmentsService.AttachmentError
      > = await Promise.all(
        files.map(async (file) => {
          if (!file.size) {
            return generateErrorAttachment(
              file,
              file.name,
              element,
              'You cannot upload an empty file.',
            )
          }
          const fileSizeInMB = file.size / 1024 / 1024
          if (maxFileSize && fileSizeInMB > maxFileSize) {
            return generateErrorAttachment(
              file,
              file.name,
              element,
              `File size ${fileSizeInMB.toFixed(2)}MB exceeds the allowed maximum of ${maxFileSize}MB.`,
            )
          }
          const result = await correctFileOrientation(file)
          if (result instanceof Blob) {
            return prepareNewAttachment(result, file.name, element)
          }

          const blob = await canvasToBlob(result)
          return prepareNewAttachment(blob, file.name, element)
        }),
      )

      onChange(element, {
        value: (currentAttachments) => {
          if (!currentAttachments) return newAttachments
          return [...currentAttachments, ...newAttachments]
        },
      })
      if (isMounted.current) {
        setIsDirty()
      }
    },
    [element, isMounted, onChange, setIsDirty],
  )

  const removeAttachment = React.useCallback(
    (id: string) => {
      onChange(element, {
        value: (currentAttachments) => {
          const newAttachments = currentAttachments?.filter((att) => {
            // Return items that are not the removed id
            if (!att.type) {
              return att.id !== id
            }
            return att._id !== id
          })
          if (newAttachments?.length) {
            return newAttachments
          }
        },
      })
      if (isMounted.current) {
        setIsDirty()
      }
    },
    [element, isMounted, onChange, setIsDirty],
  )

  const changeAttachment = React.useCallback(
    (id: string, attachment: attachmentsService.Attachment) => {
      onChange(element, {
        value: (currentAttachments) => {
          if (!currentAttachments) return
          return currentAttachments.map((att) => {
            // Can only change attachments that are not uploaded (have a type)
            if (att.type && att._id === id) {
              return attachment
            }
            return att
          })
        },
      })
      if (isMounted.current) {
        setIsDirty()
      }
    },
    [element, isMounted, onChange, setIsDirty],
  )

  return {
    addAttachments,
    removeAttachment,
    changeAttachment,
  }
}

export default useAttachments
