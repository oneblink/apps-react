import * as React from 'react'
import { attachmentsService } from '../apps'

export const OnUploadAttachmentContext = React.createContext<
  typeof attachmentsService.uploadAttachment | undefined
>(undefined)

export default function useOnUploadAttachmentContext() {
  return (
    React.useContext(OnUploadAttachmentContext) ||
    attachmentsService.uploadAttachment
  )
}
