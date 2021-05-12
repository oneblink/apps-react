type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

export type AttachmentSaved = UnwrapPromise<
  ReturnType<typeof import('@oneblink/apps').submissionService.uploadAttachment>
> & {
  type?: undefined
}

interface AttachmentBase {
  _id: string
  data: Blob
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
