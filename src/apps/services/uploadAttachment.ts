import { SubmissionTypes } from '@oneblink/types'
import { ProgressListener } from '../types/submissions'
import generateOneBlinkUploader from './generateOneBlinkUploader'
import fileTypeChecker from 'file-type-checker'

export type UploadAttachmentConfiguration = {
  fileName: string
  contentType?: string
  isPrivate: boolean
  data: Blob
  formId: number
  onProgress?: ProgressListener
}

/**
 * Upload a submission attachment. Attachment can be passed as a `Blob`,
 * `Uint8Array` or `string` (base64). Will return data required form accessing
 * the attachment.
 *
 * ### Example
 *
 * ```js
 * const blob = new Blob(['a string of data'], {
 *   type: 'text/plain',
 * })
 * const file = {
 *   formId: 1,
 *   data: blob,
 *   fileName: 'file.jpg',
 *   contentType: 'image/jpeg',
 *   isPrivate: true, // Whether the attachment will be able to be downloaded by other users
 * }
 * const abortController = new AbortController()
 * const {
 *   s3: {
 *     key, // string
 *     bucket, // string
 *     region, // string
 *   },
 *   url, // string
 *   contentType, // string
 *   fileName, // string
 *   id, //string
 *   isPrivate, // boolean
 *   uploadedAt, // string
 * } = await submissionService.uploadAttachment(
 *   file,
 *   abortController.signal,
 * )
 * ```
 *
 * @param options
 * @param abortSignal
 * @returns
 */
export default async function uploadAttachment(
  {
    formId,
    fileName,
    contentType,
    isPrivate,
    data,
    onProgress,
  }: UploadAttachmentConfiguration,
  abortSignal?: AbortSignal,
): Promise<SubmissionTypes.FormSubmissionAttachment> {
  const oneblinkUploader = generateOneBlinkUploader()

  let _contentType = contentType || 'application/octet-stream' // S3 default for unknown content type
  if (!contentType) {
    const buffer = await data.arrayBuffer()
    const detectedType = fileTypeChecker.detectFile(buffer)
    if (detectedType) {
      _contentType = detectedType.mimeType
    }
  }
  const result = await oneblinkUploader.uploadAttachment({
    formId,
    fileName,
    contentType: _contentType,
    isPrivate,
    data,
    abortSignal,
    onProgress,
  })
  return {
    s3: result.s3,
    url: result.url,
    contentType: _contentType,
    fileName,
    id: result.attachmentDataId,
    isPrivate,
    uploadedAt: result.uploadedAt,
  }
}
