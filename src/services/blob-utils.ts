import { authService } from '@oneblink/apps'

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
