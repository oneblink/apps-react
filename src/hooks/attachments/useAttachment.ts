import * as React from 'react'
import { Sentry, submissionService } from '@oneblink/apps'
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

export type OnChange = (id: string, attachment: Attachment) => void

export default function useAttachment(
  value: FormElementBinaryStorageValue,
  element: FormTypes.FormElementBinaryStorage,
  onChange: OnChange,
) {
  const isPrivate = element.storageType === 'private'
  const form = useFormDefinition()
  const isOffline = useIsOffline()
  const { isLoggedIn, isUsingFormsKey } = useAuth()

  const isAuthenticated = isLoggedIn || isUsingFormsKey

  const [imageUrlState, setImageUrlState] = React.useState<{
    imageUrl?: string | null
    loadImageUrlError?: Error
  }>({})

  // TRIGGER UPLOAD
  React.useEffect(() => {
    if (isOffline) {
      return
    }

    const formId = form?.id
    if (!formId) {
      return
    }

    if (!value || typeof value !== 'object' || value.type !== 'NEW') {
      return
    }

    const newAttachment = value as AttachmentNew

    let ignore = false

    const effect = async () => {
      try {
        console.log(
          'Attempting to upload attachment...',
          newAttachment.fileName,
        )
        const upload = await submissionService.uploadAttachment({
          formId,
          file: {
            name: newAttachment.fileName,
            type: newAttachment.data.type,
            data: newAttachment.data,
            isPrivate,
          },
        })
        if (ignore) {
          return
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
        Sentry.captureException(error)
        onChange(newAttachment._id, {
          ...newAttachment,
          type: 'ERROR',
          errorMessage: error.message,
        })
      }
    }

    effect()

    return () => {
      ignore = true
    }
  }, [form?.id, isOffline, isPrivate, onChange, value])

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

    // If user is not logged in, we can't download private images.
    // Luckily, the imageUrl should already be set as the blob
    // url from when they uploaded it. Same applies if they are offline.
    if (!isAuthenticated || isOffline) {
      setImageUrlState((currentState) => ({
        imageUrl: currentState.imageUrl || null,
      }))
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

        const imageUrl = URL.createObjectURL(blob)
        console.log(
          'Created object url from private attachment for image',
          imageUrl,
        )
        setImageUrlState({
          imageUrl,
        })
      } catch (error) {
        // Cancelling will throw an error.
        if (ignore || error.name === 'AbortError') {
          return
        }
        console.log('Error loading file:', error)
        setImageUrlState({
          loadImageUrlError: error,
        })
      }
    }
    effect()

    return () => {
      ignore = true
      abortController.abort()
    }
  }, [isAuthenticated, isOffline, value])

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
    const isDownloadableAttachment = (attachment: Attachment) =>
      !attachment.isPrivate || isAuthenticated

    return (
      !!value && (typeof value === 'string' || isDownloadableAttachment(value))
    )
  }, [isAuthenticated, value])

  return {
    isUploading,
    uploadErrorMessage,
    isLoadingImageUrl: imageUrlState.imageUrl === undefined,
    ...imageUrlState,
    canDownload,
  }
}
