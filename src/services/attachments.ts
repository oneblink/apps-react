import { FormTypes } from '@oneblink/types'
import { Sentry } from '@oneblink/apps'
import { v4 as uuid } from 'uuid'
import { AttachmentNew } from '../types/attachments'
import { blobToCanvas, getBlobOrientation } from './blob-utils'

export function prepareNewAttachment(
  blob: Blob,
  fileName: string,
  element: FormTypes.FormElementBinaryStorage,
): AttachmentNew {
  return {
    _id: uuid(),
    data: blob,
    fileName,
    isPrivate: element.storageType === 'private',
    type: 'NEW',
  }
}

export function checkIfContentTypeIsImage(contentType: string) {
  return contentType.indexOf('image/') === 0
}

export function checkIsUsingLegacyStorage(
  element: FormTypes.FormElementBinaryStorage,
): boolean {
  return !element.storageType || element.storageType === 'legacy'
}

export async function parseFilesAsAttachmentsLegacy(
  files: File[],
  onAnnotateCanvas?: (file: File, canvas: HTMLCanvasElement) => void,
): Promise<Array<{ data: string; fileName: string; contentType: string }>> {
  const attachments: Array<{
    data: string
    fileName: string
    contentType: string
  }> = []

  for (const file of files) {
    const result = await correctFileOrientation(file, onAnnotateCanvas)

    if (result instanceof Blob) {
      console.log('Attempting to parse File as attachment', file)

      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = function () {
          resolve(reader.result as string)
        }
        reader.onerror = function () {
          reject(new Error('Could not read file from data url'))
        }
        reader.readAsDataURL(file)
      })

      attachments.push({
        fileName: file.name,
        contentType: file.type,
        data: base64data,
      })
    } else {
      attachments.push({
        fileName: file.name,
        contentType: file.type,
        data: result.toDataURL(),
      })
    }
  }

  return attachments
}

export async function correctFileOrientation(
  file: File,
  onAnnotateCanvas?: (file: File, canvas: HTMLCanvasElement) => void,
): Promise<Blob | HTMLCanvasElement> {
  try {
    if (!checkIfContentTypeIsImage(file.type)) {
      return file
    }

    console.log('Attempting to parse File as image attachment', file)

    const orientation = await getBlobOrientation(file)
    if (
      (typeof orientation !== 'number' || orientation === 1) &&
      !onAnnotateCanvas
    ) {
      console.log('Skipping orientation correction for image')
      return file
    }

    console.log(
      'Loading image onto canvas to correct orientation using image meta data',
      { orientation },
    )
    const canvas = await blobToCanvas(file, orientation)
    if (onAnnotateCanvas) {
      onAnnotateCanvas(file, canvas)
    }
    return canvas
  } catch (err) {
    console.warn('Failed to rotate the orientation of a file:', err)
    Sentry.captureException(err)
    return file
  }
}
