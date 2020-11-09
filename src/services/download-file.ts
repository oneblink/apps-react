import * as bulmaToast from 'bulma-toast'
import fileSaver from 'file-saver'

export default async function downloadFile(dataURI: string, fileName: string) {
  try {
    if (window.cordova) {
      const blob = await convertDataUriToBlob(dataURI)
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
                      // @ts-ignore
                      window.cordova.plugins.fileOpener2.open(
                        // @ts-ignore
                        fileEntry.nativeURL,
                        blob.type,
                        {
                          error: (error: Error) => {
                            console.log(
                              'An error occurred opening the downloaded file',
                            )
                            reject(error)
                          },
                          success: () => resolve(),
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
            console.log(
              'An error occurred requesting access to the file system',
            )
            reject(error)
          },
        )
      })
      return
    } else {
      fileSaver.saveAs(dataURI, fileName)
    }
  } catch (error) {
    if (error) {
      console.warn('An error occurred attempting to download file:', error)
      bulmaToast.toast({
        message:
          'Sorry, there was an issue downloading your file, please try again.',
        // @ts-ignore
        type: 'ob-toast is-danger cypress-download-file-toast',
        position: 'bottom-right',
        dismissible: true,
        closeOnClick: true,
        opacity: 0.75,
      })
    }
  }
}

async function convertDataUriToBlob(dataURI: string) {
  const response = await fetch(dataURI)
  const blob = await response.blob()
  return blob
}
