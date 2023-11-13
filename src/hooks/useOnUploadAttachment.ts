import * as React from 'react'
import { onUploadAttachmentConfiguration } from '../types/attachments'
import { SubmissionTypes } from '@oneblink/types'

export const OnUploadAttachmentContext = React.createContext<
  | ((
      upload: onUploadAttachmentConfiguration,
      abortSignal?: AbortSignal,
    ) => Promise<SubmissionTypes.FormSubmissionAttachment>)
  | undefined
>(undefined)

export default function useOnUploadAttachmentContext() {
  return React.useContext(OnUploadAttachmentContext)
}
