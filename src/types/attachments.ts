type AttachmentSaved =
  import('@oneblink/types').SubmissionTypes.FormSubmissionAttachment & {
    type?: undefined
  }

interface AttachmentBase {
  _id: string
  data?: Blob
  fileName: string
  isPrivate: boolean
}

export type AttachmentNew = AttachmentBase & {
  type: 'NEW'
}
export type AttachmentError = AttachmentBase & {
  type: 'ERROR'
  errorMessage: string
}

export type Attachment = AttachmentSaved | AttachmentNew | AttachmentError

export type FormElementBinaryStorageValue = Attachment | string | undefined
