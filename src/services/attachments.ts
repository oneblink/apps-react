import { FormTypes } from '@oneblink/types'
import { v4 as uuid } from 'uuid'
import { AttachmentNew } from '../types/attachments'

export function prepareNewAttachment(
  blob: Blob,
  fileName: string,
  element: FormTypes.FormElementBinaryStorage,
): AttachmentNew {
  return {
    _id: uuid(),
    data: blob,
    fileName,
    isPrivate: element.storageType === 'private',
    type: 'NEW',
  }
}

export function checkIfContentTypeIsImage(contentType: string) {
  return contentType.indexOf('image/') === 0
}
