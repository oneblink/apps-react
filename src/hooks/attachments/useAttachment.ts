import * as React from 'react'
import { attachmentsService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import useFormDefinition from '../useFormDefinition'
import useIsOffline from '../useIsOffline'
import { FormElementBinaryStorageValue } from '../../types/attachments'
import { checkIfContentTypeIsImage } from '../../services/attachments'
import useAuth from '../../hooks/useAuth'
import { urlToBlobAsync } from '../../services/blob-utils'
import useAttachmentBlobs from '../../hooks/attachments/useAttachmentBlobs'
import useOnUploadAttachmentContext from '../useOnUploadAttachment'

export type OnChange = (
  id: string,
  attachment: attachmentsService.Attachment,
) => void

export default function useAttachment(
  value: FormElementBinaryStorageValue,
  element: FormTypes.FormElementBinaryStorage,
  onChange: OnChange,
  disableUpload?: boolean,
) {
  const isPrivate = element.storageType !== 'public'
  const form = useFormDefinition()
  const isOffline = useIsOffline()
  const onUploadAttachment = useOnUploadAttachmentContext()
  const { isLoggedIn, isUsingFormsKey } = useAuth()
  const { storeAttachmentBlobLocally, getAttachmentBlobLocally } =
    useAttachmentBlobs()

  const isAuthenticated = isLoggedIn || isUsingFormsKey

  const [attachmentUrlState, setAttachmentUrlState] = React.useState<{
    attachmentUrl?: string | null
    loadAttachmentUrlError?: Error
    isContentTypeImage?: boolean
  }>({})
  const [progressState, setProgressState] = React.useState<number | undefined>()

  const onProgress = React.useCallback(({ progress }: { progress: number }) => {
    setProgressState(progress)
  }, [])

  // TRIGGER UPLOAD
  React.useEffect(() => {
    const formId = form?.id

    if (
      isOffline ||
      disableUpload ||
      !formId ||
      !value ||
      typeof value !== 'object' ||
      value.type !== 'NEW' ||
      !value.data
    ) {
      return
    }

    const newAttachment = value as attachmentsService.AttachmentNew
    const data = value.data

    let ignore = false
    const abortController = new AbortController()

    const effect = async () => {
      try {
        console.log(
          'Attempting to upload attachment...',
          newAttachment.fileName,
        )
        const upload = await onUploadAttachment(
          {
            formId,
            fileName: newAttachment.fileName,
            contentType: data.type,
            data,
            isPrivate,
            onProgress,
          },
          abortController.signal,
        )
        if (ignore) {
          return
        }

        storeAttachmentBlobLocally({ attachmentId: upload.id, blob: data })

        console.log('Successfully Uploaded attachment!', upload)

        // UPDATE ATTACHMENT
        onChange(newAttachment._id, upload)
      } catch (error) {
        if (ignore) {
          return
        }

        console.warn(
          'Failed to upload attachment...',
          newAttachment.fileName,
          error,
        )
        onChange(newAttachment._id, {
          ...newAttachment,
          type: 'ERROR',
          errorMessage: (error as Error).message,
        })
      }
    }

    effect()

    return () => {
      ignore = true
      abortController.abort()
    }
  }, [
    disableUpload,
    form?.id,
    isOffline,
    isPrivate,
    onChange,
    onProgress,
    onUploadAttachment,
    storeAttachmentBlobLocally,
    value,
  ])

  // TRIGGER DOWNLOAD
  React.useEffect(() => {
    if (!value) {
      return
    }

    // If the value is string we will assume a base64 data uri
    if (typeof value === 'string') {
      setAttachmentUrlState({
        attachmentUrl: value,
      })
      return
    }

    if (value.type) {
      if (!value.data) {
        return
      }

      const attachmentUrl = URL.createObjectURL(value.data)
      setAttachmentUrlState({
        attachmentUrl,
        isContentTypeImage: checkIfContentTypeIsImage(value.data.type),
      })
      return
    }

    // Check for locally stored Blob
    const locallyStoredAttachment = getAttachmentBlobLocally(value.id)
    if (locallyStoredAttachment) {
      const attachmentUrl = URL.createObjectURL(locallyStoredAttachment.blob)
      console.log('Created object url from locally stored Blob', attachmentUrl)
      setAttachmentUrlState({
        attachmentUrl,
        isContentTypeImage: checkIfContentTypeIsImage(value.contentType),
      })
      return
    }

    // If user is not logged in or is offline, we can't download private attachments.
    // If the blob was not stored locally (above) for some reason, the user is SOL
    if (!isAuthenticated || isOffline) {
      setAttachmentUrlState({
        attachmentUrl: null,
      })
      return
    }

    let ignore = false
    const abortController = new AbortController()
    const privateAttachmentUrl = value.url

    const effect = async () => {
      try {
        const blob = await urlToBlobAsync(
          privateAttachmentUrl,
          abortController.signal,
        )
        if (ignore) {
          return
        }
        // Store private attachment in Context
        storeAttachmentBlobLocally({ attachmentId: value.id, blob })
        const attachmentUrl = URL.createObjectURL(blob)
        console.log(
          'Created object url from private attachment for image',
          attachmentUrl,
        )
        setAttachmentUrlState({
          attachmentUrl: attachmentUrl,
        })
      } catch (error) {
        if (ignore) {
          return
        }
        console.warn('Error loading file:', error)
        setAttachmentUrlState({
          loadAttachmentUrlError: error as Error,
        })
      }
    }
    effect()

    return () => {
      ignore = true
      abortController.abort()
    }
  }, [
    getAttachmentBlobLocally,
    isAuthenticated,
    isOffline,
    storeAttachmentBlobLocally,
    value,
  ])

  React.useEffect(() => {
    return () => {
      const attachmentUrl = attachmentUrlState.attachmentUrl
      if (attachmentUrl && attachmentUrl.startsWith('blob:')) {
        console.log('revoking attachment url:', attachmentUrl)
        URL.revokeObjectURL(attachmentUrl)
      }
    }
  }, [attachmentUrlState.attachmentUrl])

  const isUploading = React.useMemo(() => {
    return !!(
      value &&
      typeof value !== 'string' &&
      value.type &&
      value.type === 'NEW'
    )
  }, [value])

  const uploadErrorMessage = React.useMemo(() => {
    if (
      value &&
      typeof value !== 'string' &&
      value.type &&
      value.type === 'ERROR'
    ) {
      return value.errorMessage
    }
  }, [value])

  const canDownload = React.useMemo(() => {
    if (!value) {
      return false
    }

    // legacy attachment as base64 data
    if (typeof value === 'string') {
      return true
    }

    // attachments still uploading or failed to upload
    if (value.type) {
      // can only be downloaded if we still have the data
      return !!value.data
    }

    // private attachments can only be downloaded if user is authenticated
    if (isAuthenticated) {
      return true
    }

    return false
  }, [isAuthenticated, value])

  return {
    isUploading,
    uploadErrorMessage,
    isLoadingAttachmentUrl: attachmentUrlState.attachmentUrl === undefined,
    ...attachmentUrlState,
    canDownload,
    progress: progressState,
  }
}
