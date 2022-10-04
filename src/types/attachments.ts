import { attachmentsService } from '@oneblink/apps'

export type FormElementBinaryStorageValue =
  | attachmentsService.Attachment
  | string
  | undefined
