import { Sentry, attachmentsService } from '@oneblink/apps'
import * as bulmaToast from 'bulma-toast'
import fileSaver from 'file-saver'
import { urlToBlobAsync } from './blob-utils'
import tenants from '@oneblink/apps/dist/tenants'

async function downloadFile(data: Blob | string, fileName: string) {
  if (window.cordova) {
    const file = typeof data === 'string' ? await urlToBlobAsync(data) : data
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
                      file.type,
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

                  fileWriter.write(file)
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
    fileSaver.saveAs(data, fileName)
  }
}

const handleError = (error?: Error) => {
  if (error) {
    console.warn('An error occurred attempting to download file:', error)
    Sentry.captureException(error)
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

export async function downloadFileLegacy(dataURI: string, fileName: string) {
  try {
    return await downloadFile(dataURI, fileName)
  } catch (error) {
    handleError(error as Error)
  }
}

export default async function downloadAttachment(
  attachment: attachmentsService.Attachment,
) {
  try {
    if (attachment.type) {
      if (attachment.data) {
        await downloadFile(attachment.data, attachment.fileName)
      }
      return
    }
    const safeAttachmentUrl = new URL(tenants.current.apiOrigin)
    const unsafeAttachmentUrl = new URL(attachment.url)
    safeAttachmentUrl.pathname = unsafeAttachmentUrl.pathname
    const blob = await urlToBlobAsync(safeAttachmentUrl.href)
    return await downloadFile(blob, attachment.fileName)
  } catch (error) {
    handleError(error as Error)
  }
}
