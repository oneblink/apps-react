import * as React from 'react'
import { submissionService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import useFormDefinition from '../useFormDefinition'
import useIsOffline from '../useIsOffline'
import {
  Attachment,
  AttachmentNew,
  FormElementBinaryStorageValue,
} from '../../types/attachments'
import { checkIfContentTypeIsImage } from '../../services/attachments'
import useAuth from '../../hooks/useAuth'
import { urlToBlobAsync } from '../../services/blob-utils'
import useAttachmentBlobs from '../../hooks/attachments/useAttachmentBlobs'

export type OnChange = (id: string, attachment: Attachment) => void

export default function useAttachment(
  value: FormElementBinaryStorageValue,
  element: FormTypes.FormElementBinaryStorage,
  onChange: OnChange,
  disableUpload?: boolean,
) {
  const isPrivate = element.storageType !== 'public'
  const form = useFormDefinition()
  const isOffline = useIsOffline()
  const { isLoggedIn, isUsingFormsKey } = useAuth()
  const { storeAttachmentBlobLocally, getAttachmentBlobLocally } =
    useAttachmentBlobs()

  const isAuthenticated = isLoggedIn || isUsingFormsKey

  const [imageUrlState, setImageUrlState] = React.useState<{
    imageUrl?: string | null
    loadImageUrlError?: Error
  }>({})

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

    const newAttachment = value as AttachmentNew
    const data = value.data

    let ignore = false
    const abortController = new AbortController()

    const effect = async () => {
      try {
        console.log(
          'Attempting to upload attachment...',
          newAttachment.fileName,
        )
        const upload = await submissionService.uploadAttachment(
          {
            formId,
            fileName: newAttachment.fileName,
            contentType: data.type,
            data,
            isPrivate,
          },
          abortController.signal,
        )
        if (ignore) {
          return
        }
        // Store Blob in Context if image is private
        if (isPrivate) {
          storeAttachmentBlobLocally({ attachmentId: upload.id, blob: data })
        }

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
      setImageUrlState({
        imageUrl: value,
      })
      return
    }

    if (value.type) {
      if (!value.data) {
        return
      }

      if (!checkIfContentTypeIsImage(value.data.type)) {
        // Not an image which we will represent as null
        setImageUrlState({
          imageUrl: null,
        })
        return
      }

      const imageUrl = URL.createObjectURL(value.data)
      console.log('Created object url from blob for image', imageUrl)
      setImageUrlState({
        imageUrl,
      })
      return
    }

    if (!checkIfContentTypeIsImage(value.contentType)) {
      // Not an image which we will represent as null
      setImageUrlState({
        imageUrl: null,
      })
      return
    }

    // If the file is a public url we can finish here and just use that
    if (!value.isPrivate) {
      setImageUrlState({
        imageUrl: value.url,
      })
      return
    }

    // Check for locally stored Blob. Blob should be stored locally for private uploaded images only
    const locallyStoredAttachment = getAttachmentBlobLocally(value.id)
    if (locallyStoredAttachment) {
      const imageUrl = URL.createObjectURL(locallyStoredAttachment.blob)
      console.log(
        'Created object url from locally stored Blob for private image attachment',
        imageUrl,
      )
      setImageUrlState({
        imageUrl,
      })
      return
    }

    // If user is not logged in or is offline, we can't download private images.
    // If the blob was not stored locally (above) for some reason, the user is SOL
    if (!isAuthenticated || isOffline) {
      setImageUrlState({
        imageUrl: null,
      })
      return
    }

    let ignore = false
    const abortController = new AbortController()
    const privateImageUrl = value.url

    const effect = async () => {
      try {
        const blob = await urlToBlobAsync(
          privateImageUrl,
          true,
          abortController.signal,
        )
        if (ignore) {
          return
        }
        // Store private image attachment in Context
        storeAttachmentBlobLocally({ attachmentId: value.id, blob })
        const imageUrl = URL.createObjectURL(blob)
        console.log(
          'Created object url from private attachment for image',
          imageUrl,
        )
        setImageUrlState({
          imageUrl,
        })
      } catch (error) {
        if (ignore) {
          return
        }
        console.warn('Error loading file:', error)
        setImageUrlState({
          loadImageUrlError: error as Error,
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
      const imageUrl = imageUrlState.imageUrl
      if (imageUrl && imageUrl.startsWith('blob:')) {
        console.log('revoking image url:', imageUrl)
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrlState.imageUrl])

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

    // attachments that have been uploaded
    // public attachments can always be downloaded
    if (!value.isPrivate) {
      return true
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
    isLoadingImageUrl: imageUrlState.imageUrl === undefined,
    ...imageUrlState,
    canDownload,
  }
}
