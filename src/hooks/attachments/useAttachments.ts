import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import { prepareNewAttachment } from '../../services/attachments'
import {
  Attachment,
  AttachmentError,
  AttachmentNew,
  AttachmentValid,
} from '../../types/attachments'

type State = {
  validAttachments: AttachmentValid[]
  errorAttachments: AttachmentError[]
  allAttachments: Attachment[]
}
type Actions = {
  addAttachments: (newAttachments: File[]) => void
  removeAttachment: (id: string) => void
  changeAttachment: (id: string, attachment: Attachment) => void
  clearInvalidAttachments: () => void
}

const useAttachments = (
  allAttachments: Attachment[],
  element: FormTypes.FilesElement,
  onChange: FormElementValueChangeHandler<Attachment[]>,
): [State, Actions] => {
  const validAttachments = React.useMemo(() => {
    return allAttachments.filter((att) => {
      return att.type !== 'ERROR'
    }) as AttachmentValid[]
  }, [allAttachments])

  const errorAttachments = React.useMemo(() => {
    return allAttachments.filter((att) => {
      return att.type === 'ERROR'
    }) as AttachmentError[]
  }, [allAttachments])

  const addAttachments = React.useCallback(
    (files: File[]): void => {
      if (!files.length) return
      // TODO: Rotate orientation of sideways camera images
      const newAttachments: AttachmentNew[] = files.map((file) => {
        return prepareNewAttachment(file, file.name, element)
      })

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

  return [
    { allAttachments, validAttachments, errorAttachments },
    {
      addAttachments,
      removeAttachment,
      changeAttachment,
      clearInvalidAttachments,
    },
  ]
}

export default useAttachments
