import * as React from 'react'

type AttachmentObjectBlob = {
  attachmentId: string
  blob: Blob
}
type RegisterAttachmentParam = {
  blob: Blob
  attachmentId: string
}
type AttachmentBlobsContextValue = {
  storeAttachmentBlobLocally: (options: RegisterAttachmentParam) => void
  getAttachmentBlobLocally: (
    attachmentId: string,
  ) => AttachmentObjectBlob | undefined
}

type Props = {
  children: React.ReactNode
}

const AttachmentBlobsContext = React.createContext<AttachmentBlobsContextValue>(
  {
    storeAttachmentBlobLocally: () => {},
    getAttachmentBlobLocally: () => undefined,
  },
)

export const AttachmentBlobsProvider = ({ children }: Props) => {
  const [attachmentBlobs, setAttachmentBlobs] = React.useState<
    AttachmentObjectBlob[]
  >([])
  const storeAttachmentBlobLocally = React.useCallback(
    (newAttachment: RegisterAttachmentParam) => {
      setAttachmentBlobs((c) => [...c, newAttachment])
    },
    [],
  )

  const getAttachmentBlobLocally = React.useCallback(
    (attachmentId: string) => {
      return attachmentBlobs.find((b) => b.attachmentId === attachmentId)
    },
    [attachmentBlobs],
  )

  const value = React.useMemo(
    () => ({
      storeAttachmentBlobLocally,
      getAttachmentBlobLocally,
    }),
    [storeAttachmentBlobLocally, getAttachmentBlobLocally],
  )

  return (
    <AttachmentBlobsContext.Provider value={value}>
      {children}
    </AttachmentBlobsContext.Provider>
  )
}

const useAttachmentBlobs = () => {
  return React.useContext(AttachmentBlobsContext)
}
export default useAttachmentBlobs
