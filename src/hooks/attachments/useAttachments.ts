import * as React from 'react'
import { submissionService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import { v4 as uuid } from 'uuid'

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

export type AttachmentConfiguration = UnwrapPromise<
  ReturnType<typeof submissionService.uploadAttachment>
> & {
  type?: undefined
}

interface AttachmentSavingBase {
  _id: string
  data: Blob
  fileName: string
  isPrivate: boolean
}

export type AttachmentNew = AttachmentSavingBase & {
  type: 'NEW'
}
type AttachmentSaving = AttachmentSavingBase & {
  type: 'SAVING'
}
export type AttachmentError = AttachmentSavingBase & {
  type: 'ERROR'
}

export type AttachmentValid =
  | AttachmentConfiguration
  | AttachmentNew
  | AttachmentSaving

export type Attachment = AttachmentValid | AttachmentError

export type OnChangeAttachments<T> = (
  formElement: FormTypes.FormElement,
  newValue: undefined | T | ((currentValue: undefined | T) => undefined | T),
) => void

export type StorageElement =
  | FormTypes.FilesElement
  | FormTypes.DrawElement
  | FormTypes.CameraElement
  | FormTypes.ComplianceElement

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
  element: StorageElement,
  onChange: OnChangeAttachments<Attachment[]>,
): [State, Actions] => {
  const isPrivate = element.storageType === 'private'

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
        return {
          _id: uuid(),
          data: file,
          fileName: file.name,
          isPrivate,
          type: 'NEW',
        }
      })

      onChange(element, (currentAttachments) => {
        if (!currentAttachments) return newAttachments
        return [...currentAttachments, ...newAttachments]
      })
    },
    [element, isPrivate, onChange],
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
