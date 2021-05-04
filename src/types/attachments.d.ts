type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

export type AttachmentSaved = UnwrapPromise<
  ReturnType<typeof import('@oneblink/apps').submissionService.uploadAttachment>
> & {
  type?: undefined
}

interface AttachmentSavingBase {
  _id: string
  data: Blob
  fileName: string
  isPrivate: boolean
}

export type AttachmentNew = AttachmentSavingBase & {
  type: 'NEW'
}
type AttachmentSaving = AttachmentSavingBase & {
  type: 'SAVING'
}
export type AttachmentError = AttachmentSavingBase & {
  type: 'ERROR'
  errorMessage: string
}

export type AttachmentValid = AttachmentSaved | AttachmentNew | AttachmentSaving

export type Attachment = AttachmentValid | AttachmentError

export type FormElementBinaryStorageValue = Attachment | string | undefined
