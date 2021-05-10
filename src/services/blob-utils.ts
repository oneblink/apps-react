import { authService } from '@oneblink/apps'
import loadImage from 'blueimp-load-image'

// Copied from https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize)

    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  const blob = new Blob(byteArrays, { type: contentType })
  return blob
}

export function dataUriToBlobSync(dataUri: string) {
  const [prefix, b64Data] = dataUri.split(',')
  const matches = prefix.match(/data:(.*);base64/)
  const [, contentType] = matches || []
  return b64toBlob(b64Data, contentType)
}

async function generateRequestInit(
  isPrivate?: boolean,
): Promise<RequestInit | undefined> {
  if (!isPrivate) {
    return
  }

  const idToken = await authService.getIdToken()
  if (idToken) {
    return {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  }
}

export async function urlToBlobAsync(url: string, isPrivate?: boolean) {
  const requestInit = await generateRequestInit(isPrivate)
  const response = await fetch(url, requestInit)
  if (!response.ok) {
    throw new Error(
      `Unable to download file. HTTP Status Code: ${response.status}`,
    )
  }
  return await response.blob()
}

export async function blobToCanvas(
  blob: Blob,
  orientation?: number,
): Promise<HTMLCanvasElement> {
  const loadImageResult = await loadImage(blob, {
    canvas: true,
    orientation: orientation,
  })
  // @ts-expect-error this it always be a HTMLCanvasElement because we passed `canvas: true` above
  const canvas: HTMLCanvasElement = loadImageResult.image
  return canvas
}

export async function canvasToBlob(canvas: HTMLCanvasElement) {
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      reject(new Error('Failed to convert canvas back to blob.'))
    })
  })
  return blob
}

export async function getBlobOrientation(
  blob: Blob,
): Promise<number | undefined> {
  // @ts-expect-error For some reason, the types do not include this function returning a promise
  const imageMetaData: loadImage.MetaData = await loadImage.parseMetaData(blob)
  const orientation = imageMetaData.exif?.get('Orientation')
  return orientation as number | undefined
}
