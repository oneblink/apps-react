import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import {
  prepareNewAttachment,
  correctFileOrientation,
} from '../../services/attachments'
import { attachmentsService } from '@oneblink/apps'
import { canvasToBlob } from '../../services/blob-utils'
import useBooleanState from '../useBooleanState'
import useIsMounted from '../useIsMounted'
import { FormElementValueChangeHandler } from '../../types/form'

const useAttachments = (
  element: FormTypes.FilesElement,
  onChange: FormElementValueChangeHandler<attachmentsService.Attachment[]>,
) => {
  const isMounted = useIsMounted()
  const [isDirty, setIsDirty] = useBooleanState(false)

  const addAttachments = React.useCallback(
    async (files: File[]): Promise<void> => {
      if (!files.length) return
      const newAttachments: attachmentsService.AttachmentNew[] =
        await Promise.all(
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
      if (isMounted.current) {
        setIsDirty()
      }
    },
    [element, isMounted, onChange, setIsDirty],
  )

  const removeAttachment = React.useCallback(
    (id: string) => {
      onChange(element, (currentAttachments) => {
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
      })
      if (isMounted.current) {
        setIsDirty()
      }
    },
    [element, isMounted, onChange, setIsDirty],
  )

  const changeAttachment = React.useCallback(
    (id: string, attachment: attachmentsService.Attachment) => {
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
      if (isMounted.current) {
        setIsDirty()
      }
    },
    [element, isMounted, onChange, setIsDirty],
  )

  return {
    isDirty,
    addAttachments,
    removeAttachment,
    changeAttachment,
  }
}

export default useAttachments
