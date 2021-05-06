import { Sentry } from '@oneblink/apps'
import loadImage from 'blueimp-load-image'
import { AttachmentNew } from '../types/attachments'

async function correctFileOrientationAsCanvas(
  file: File | Blob,
): Promise<HTMLCanvasElement> {
  // @ts-expect-error For some reason, the types do not include this function returning a promise
  const imageMetaData: loadImage.MetaData = await loadImage.parseMetaData(file)

  console.log(
    'Loading image onto canvas to correct orientation using image meta data',
    imageMetaData,
  )
  const orientation = imageMetaData.exif?.get('Orientation')
  const loadImageResult = await loadImage(file, {
    canvas: true,
    orientation: typeof orientation === 'number' ? orientation : 0,
  })
  // @ts-expect-error this it always be a HTMLCanvasElement because we passed `canvas: true` above
  const canvas: HTMLCanvasElement = loadImageResult.image
  return canvas
}

async function convertCanvasToBlob(canvas: HTMLCanvasElement) {
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      reject(new Error('Failed to convert canvas back to blob.'))
    })
  })
  return blob
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
    try {
      if (file.type && file.type.startsWith('image/')) {
        // Unfortunately, photos taken from a native camera can come in with an incorrect
        // orientation. Luckily, we are not the only people in the world to have this issue
        // and someone else has already solved with this nice library.
        console.log('Attempting to parse File as image attachment', file)

        const canvas = await correctFileOrientationAsCanvas(file)

        if (onAnnotateCanvas) {
          onAnnotateCanvas(file, canvas)
        }

        const base64data = canvas.toDataURL(file.type)

        attachments.push({
          fileName: file.name,
          contentType: file.type,
          data: base64data,
        })
      } else {
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
      }
    } catch (error) {
      console.warn('Error converting files to attachments', error)
      Sentry.captureException(error)
      throw error
    }
  }

  return attachments
}

export async function correctNewAttachmentOrientation(
  attachment: AttachmentNew,
): Promise<AttachmentNew> {
  try {
    const canvas = await correctFileOrientationAsCanvas(attachment.data)
    const blob = await convertCanvasToBlob(canvas)
    return {
      ...attachment,
      data: blob,
    }
  } catch (err) {
    console.warn('Failed to rotate the orientation of a file:', err)
    return attachment
  }
}
