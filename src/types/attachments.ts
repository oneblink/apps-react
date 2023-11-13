import { attachmentsService } from '@oneblink/apps'

export type FormElementBinaryStorageValue =
  | attachmentsService.Attachment
  | string
  | undefined

export type onUploadAttachmentConfiguration = attachmentsService.UploadAttachmentConfiguration & {
  formId: number
  onProgress?: ({ progress }: {
    progress: number;
  }) => void
}