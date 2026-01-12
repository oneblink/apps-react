import { attachmentsService } from '../apps'

export type FormElementBinaryStorageValue =
  | attachmentsService.Attachment
  | string
  | undefined
