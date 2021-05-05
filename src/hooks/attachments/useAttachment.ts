import * as React from 'react'
import { authService, Sentry, submissionService } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import useFormDefinition from '../useFormDefinition'
import useIsOffline from '../useIsOffline'
import {
  Attachment,
  AttachmentNew,
  FormElementBinaryStorageValue,
} from '../../types/attachments'
import useIsMounted from '../useIsMounted'
import { checkIfContentTypeIsImage } from '../../services/attachments'

export type OnChange = (id: string, attachment: Attachment) => void

export default function useAttachment(
  value: FormElementBinaryStorageValue,
  element: FormTypes.FormElementBinaryStorage,
  onChange: OnChange,
) {
  const isPrivate = element.storageType === 'private'
  const form = useFormDefinition()
  const isOffline = useIsOffline()
  const isMounted = useIsMounted()

  const [imageUrlState, setImageUrlState] = React.useState<{
    imageUrl?: string | null
    loadImageUrlError?: Error
  }>({})

  const uploadAttachment = React.useCallback(
    async (formId: number, newAttachment: AttachmentNew) => {
      try {
        console.log(
          'Attempting to upload attachment...',
          newAttachment.fileName,
        )

        // UPDATE TO SAVING
        onChange(newAttachment._id, {
          ...newAttachment,
          type: 'SAVING',
        })

        const upload = await submissionService.uploadAttachment({
          formId,
          file: {
            name: newAttachment.fileName,
            type: newAttachment.data.type,
            data: newAttachment.data,
            isPrivate,
          },
        })
        console.log('Successfully Uploaded attachment!', newAttachment.fileName)

        // UPDATE ATTACHMENT
        onChange(newAttachment._id, upload)
      } catch (error) {
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
    },
    [isPrivate, onChange],
  )

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

    uploadAttachment(formId, value as AttachmentNew)
  }, [form?.id, isOffline, uploadAttachment, value])

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

      return () => {
        URL.revokeObjectURL(imageUrl)
      }
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

    const privateImageUrl = value.url
    let imageUrl: string | undefined = undefined

    const effect = async () => {
      try {
        if (isOffline) {
          setImageUrlState((currentState) => ({
            imageUrl: currentState.imageUrl || null,
          }))
          return
        }

        const idToken = await authService.getIdToken()
        // If there is no token to pass to get private image
        // we can finish here as the user will not be able to
        // to get the image until they have logged in. Luckily,
        // the imageUrl should already be set as the blob url
        // from when they uploaded it.
        if (!idToken) {
          setImageUrlState((currentState) => ({
            imageUrl: currentState.imageUrl || null,
          }))
          return
        }

        const response = await fetch(privateImageUrl, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
        if (!response.ok) {
          throw new Error(
            `Unable to download file. HTTP Status Code: ${response.status}`,
          )
        }
        const blob = await response.blob()

        if (!isMounted.current) {
          return
        }

        imageUrl = URL.createObjectURL(blob)
        console.log('Created object url from blob for image', imageUrl)
        setImageUrlState({
          imageUrl,
        })
      } catch (loadImageUrlError) {
        console.log('Error loading file:', loadImageUrlError)
        if (isMounted.current) {
          setImageUrlState({ loadImageUrlError })
        }
      }
    }
    effect()

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [isMounted, isOffline, value])

  const isUploading = React.useMemo(() => {
    return !!(
      value &&
      typeof value !== 'string' &&
      value.type &&
      (value.type === 'SAVING' || value.type === 'NEW')
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

  return {
    isUploading,
    uploadErrorMessage,
    isLoadingImageUrl: imageUrlState.imageUrl === undefined,
    ...imageUrlState,
  }
}
