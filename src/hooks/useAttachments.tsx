import * as React from 'react'
import { submissionService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import useFormDefinition from './useFormDefinition'

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

export type FileConfiguration = UnwrapPromise<
  ReturnType<typeof submissionService.uploadAttachment>
>

interface AttachmentSavingBase {
  data: Blob
  contentType: string
  fileName: string
  isPrivate: boolean
}
type AttachmentSaving = AttachmentSavingBase & {
  type: 'SAVING'
}
type AttachmentLoading = FileConfiguration & {
  type: 'LOADING'
}
type AttachmentLoadingFailed = FileConfiguration & {
  type: 'LOADING_FAILED'
  error: Error
}
type AttachmentReady = FileConfiguration & {
  type: 'READY'
  data: Blob
}

export type ValidAttachment =
  | AttachmentSaving
  | AttachmentLoading
  | AttachmentLoadingFailed
  | AttachmentReady

export type AttachmentSavingFailed = AttachmentSavingBase & {
  type: 'SAVING_FAILED'
  error: Error
}

type StorageElement =
  | FormTypes.FilesElement
  | FormTypes.DrawElement
  | FormTypes.CameraElement
  | FormTypes.ComplianceElement

type State = {
  attachments: ValidAttachment[]
  invalidAttachments: AttachmentSavingFailed[]
}
type Actions = {
  addAttachments: (newAttachments: File[]) => Promise<FileConfiguration[]>
  removeAttachment: (index: number) => FileConfiguration[]
  clearInvalidAttachments: () => void
}
const useAttachments = (
  element: StorageElement,
  currentFiles: FileConfiguration[],
): [State, Actions] => {
  const isPrivate = element.storageType === 'private'
  const form = useFormDefinition()

  const [attachments, setAttachments] = React.useState<ValidAttachment[]>(
    currentFiles.map((cf) => ({ ...cf, type: 'LOADING' })),
  )
  const [invalidAttachments, setInvalidAttachments] = React.useState<
    AttachmentSavingFailed[]
  >([])

  React.useEffect(() => {
    // TODO: LOAD CURRENT FILES
  }, [])

  const clearInvalidAttachments = React.useCallback(() => {
    setInvalidAttachments([])
  }, [])

  const addAttachments = React.useCallback(
    async (newAttachments: File[]) => {
      if (!newAttachments.length || !form) return []
      // RESET INVALID LIST
      clearInvalidAttachments()

      const attachmentsToSave: AttachmentSaving[] = newAttachments
        // Filter out duplicate attachments
        .filter((newAttachment) => {
          const hasDuplicate = attachments.some(
            (att) =>
              att.fileName === newAttachment.name &&
              att.contentType === newAttachment.type,
          )
          return !hasDuplicate
        })
        .map((newAttachment) => {
          return {
            type: 'SAVING',
            data: newAttachment,
            contentType: newAttachment.type,
            fileName: newAttachment.name,
            isPrivate,
          }
        })
      setAttachments((currentValue) => [...currentValue, ...attachmentsToSave])

      const promises = newAttachments.map(async (newAttachment) => {
        try {
          console.log(
            'Attempting to Uploading attachment...',
            newAttachment.name,
          )
          const upload = await submissionService.uploadAttachment({
            formId: form.id,
            file: {
              name: newAttachment.name,
              type: newAttachment.type,
              data: newAttachment,
              isPrivate,
            },
          })

          console.log('Successfully Uploaded attachment!', newAttachment.name)
          // UPDATE ATTACHMENT AS READY
          setAttachments((currentValue) =>
            currentValue.map((att) => {
              if (
                att.type === 'SAVING' &&
                att.contentType === upload.contentType &&
                att.fileName === upload.fileName
              ) {
                const readyAttachment: AttachmentReady = {
                  ...att,
                  type: 'READY',
                  ...upload,
                }

                return readyAttachment
              } else return att
            }),
          )
          return upload
        } catch (error) {
          console.log('Failed to upload attachment...', {
            name: newAttachment.name,
            error,
          })
          setAttachments((currentValue) =>
            currentValue.filter(
              (att) =>
                // REMOVE SAVING ATTACHMENT THAT MATCHED FAILED ATTACHMENT
                !(
                  att.type === 'SAVING' &&
                  att.contentType === newAttachment.type &&
                  att.fileName === newAttachment.name
                ),
            ),
          )

          const failedAttachment: AttachmentSavingFailed = {
            fileName: newAttachment.name,
            contentType: newAttachment.type,
            data: newAttachment,
            isPrivate,
            type: 'SAVING_FAILED',
            error,
          }
          setInvalidAttachments((currentValue) => [
            ...currentValue,
            failedAttachment,
          ])
          return
        }
      })
      const addedAttachments = (await Promise.all(promises)).filter(
        (att) => !!att,
        // Casting because can't get type inference with filter
      ) as FileConfiguration[]
      return addedAttachments
    },
    [attachments, clearInvalidAttachments, form, isPrivate],
  )

  const removeAttachment = React.useCallback(
    (index: number) => {
      const attachmentToRemove: ValidAttachment = {
        ...attachments[index],
      }
      setAttachments(
        attachments.filter((att, i) => {
          return i !== index
        }),
      )
      return currentFiles.filter((cf) => {
        // RETURN ITEMS THAT ARE NOT AN EXACT MATCH OF THE REMOVED ATTACHMENT
        return !(
          cf.fileName === attachmentToRemove.fileName &&
          cf.contentType === attachmentToRemove.contentType
        )
      })
    },
    [attachments, currentFiles],
  )

  return [
    { attachments, invalidAttachments },
    { addAttachments, removeAttachment, clearInvalidAttachments },
  ]
}

export default useAttachments
