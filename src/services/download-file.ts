import { authService, Sentry } from '@oneblink/apps'
import * as bulmaToast from 'bulma-toast'
import fileSaver from 'file-saver'
import { AttachmentValid } from '../types/attachments'
async function downloadFile(blob: Blob, fileName: string) {
  if (window.cordova) {
    await new Promise((resolve, reject) => {
      window.requestFileSystem(
        window.PERSISTENT,
        0,
        (fs) => {
          fs.root.getFile(
            fileName,
            {
              create: true,
              exclusive: false,
            },
            (fileEntry) => {
              // Create a FileWriter object for our FileEntry
              fileEntry.createWriter(
                (fileWriter) => {
                  fileWriter.onwriteend = () => {
                    // @ts-expect-error ???
                    window.cordova.plugins.fileOpener2.open(
                      // @ts-expect-error ???
                      fileEntry.nativeURL,
                      blob.type,
                      {
                        error: (error: Error) => {
                          console.log(
                            'An error occurred opening the downloaded file',
                          )
                          reject(error)
                        },
                        success: () => resolve(undefined),
                      },
                    )
                  }

                  fileWriter.onerror = (error) => {
                    console.log(
                      'An error occurred writing the file to file system',
                    )
                    reject(error)
                  }

                  fileWriter.write(blob)
                },
                (error) => {
                  console.log(
                    'An error attempting to create file writer for new file',
                  )
                  reject(error)
                },
              )
            },
            (error) => {
              console.log(
                'An error occurred getting new file data from file system',
              )
              reject(error)
            },
          )
        },
        (error) => {
          console.log('An error occurred requesting access to the file system')
          reject(error)
        },
      )
    })
    return
  } else {
    fileSaver.saveAs(blob, fileName)
  }
}

export default async function downloadAttachment(attachment: AttachmentValid) {
  try {
    if (attachment.type) {
      return await downloadFile(attachment.data, attachment.fileName)
    }
    let idToken
    if (attachment.isPrivate) {
      idToken = await authService.getIdToken()
    }
    const response = await fetch(
      attachment.url,
      idToken
        ? {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        : undefined,
    )
    if (!response.ok) {
      throw new Error(
        `Unable to download file. HTTP Status Code: ${response.status}`,
      )
    }
    const blob = await response.blob()
    return await downloadFile(blob, attachment.fileName)
  } catch (error) {
    if (error) {
      Sentry.captureException(error)
      console.warn('An error occurred attempting to download file:', error)
      bulmaToast.toast({
        message:
          'Sorry, there was an issue downloading your file, please try again.',
        // @ts-expect-error bulma sets this string as a class, so we are hacking in our own classes
        type: 'ob-toast is-danger cypress-download-file-toast',
        dismissible: true,
        closeOnClick: true,
      })
    }
  }
}

export async function downloadFileLegacy(dataURI: string, fileName: string) {
  try {
    const blob = await convertDataUriToBlob(dataURI)
    return await downloadFile(blob, fileName)
  } catch (error) {
    if (error) {
      Sentry.captureException(error)
      console.warn('An error occurred attempting to download file:', error)
      bulmaToast.toast({
        message:
          'Sorry, there was an issue downloading your file, please try again.',
        // @ts-expect-error bulma sets this string as a class, so we are hacking in our own classes
        type: 'ob-toast is-danger cypress-download-file-toast',
        dismissible: true,
        closeOnClick: true,
      })
    }
  }
}

async function convertDataUriToBlob(dataURI: string) {
  const response = await fetch(dataURI)
  const blob = await response.blob()
  return blob
}
