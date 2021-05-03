import { Sentry } from '@oneblink/apps'
import loadImage from 'blueimp-load-image'

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

        // @ts-expect-error For some reason, the types do not include this function returning a promise
        const imageMetaData: loadImage.MetaData = await loadImage.parseMetaData(
          file,
        )

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
          reader.onerror = function (error) {
            reject(error)
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

export default function parseFilesAsAttachments() {
  //
}
