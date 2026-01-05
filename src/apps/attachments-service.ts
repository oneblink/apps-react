import { FormTypes, ArcGISTypes } from '@oneblink/types'
import { FormSubmissionModel, FormElementKey } from './types/form'
import uploadAttachment, {
  UploadAttachmentConfiguration,
} from './services/uploadAttachment'

type AttachmentSaved =
  import('@oneblink/types').SubmissionTypes.FormSubmissionAttachment & {
    type?: undefined
  }

type AttachmentBase = {
  _id: string
  data?: Blob
  fileName: string
  isPrivate: boolean
}

type AttachmentNew = AttachmentBase & {
  type: 'NEW'
}
type AttachmentError = AttachmentBase & {
  type: 'ERROR'
  errorType?: 'EXCEEDS_MAX_SIZE' | 'EMPTY_FILE'
  errorMessage: string
}

type AttachmentUnsaved = AttachmentNew | AttachmentError
type Attachment = AttachmentSaved | AttachmentUnsaved

export {
  Attachment,
  AttachmentBase,
  AttachmentError,
  AttachmentNew,
  AttachmentSaved,
  AttachmentUnsaved,
  FormSubmissionModel,
  FormElementKey,
  uploadAttachment,
  UploadAttachmentConfiguration,
}

/**
 * Check if the submission has attachments that are still uploading
 *
 * #### Example
 *
 * ```js
 * const isUploading = attachmentsService.checkIfAttachmentsAreUploading(
 *   form,
 *   submission,
 * )
 * // handle attachments still in progress
 * ```
 *
 * @param form
 * @param submission
 * @returns
 */
export function checkIfAttachmentsAreUploading(
  form: FormTypes.Form,
  submission: FormSubmissionModel,
): boolean {
  const submissionAttachments = getSubmissionAttachmentDetails(
    form.elements,
    submission,
  )
  return submissionAttachments.some((a) => a.needsToUpload)
}

export type SubmissionAttachmentDetail =
  | {
      needsToUpload: true
      value: AttachmentUnsaved
    }
  | {
      needsToUpload: false
      value: AttachmentSaved
    }

export function getSubmissionAttachmentDetails(
  formElements: FormTypes.FormElement[],
  submission: FormSubmissionModel,
): Array<SubmissionAttachmentDetail> {
  const submissionAttachmentDetails: SubmissionAttachmentDetail[] = []

  for (const formElement of formElements) {
    switch (formElement.type) {
      case 'page':
      case 'section': {
        submissionAttachmentDetails.push(
          ...getSubmissionAttachmentDetails(formElement.elements, submission),
        )
        break
      }
      case 'form': {
        const nestedSubmission = submission[formElement.name]
        if (!nestedSubmission || typeof nestedSubmission !== 'object') {
          break
        }
        submissionAttachmentDetails.push(
          ...getSubmissionAttachmentDetails(
            formElement.elements || [],
            nestedSubmission as FormSubmissionModel,
          ),
        )

        break
      }
      case 'repeatableSet': {
        const entries = submission[formElement.name]
        if (!Array.isArray(entries)) {
          break
        }
        for (const entry of entries) {
          submissionAttachmentDetails.push(
            ...getSubmissionAttachmentDetails(formElement.elements, entry),
          )
        }
        break
      }
      case 'arcGISWebMap':
      case 'camera':
      case 'draw':
      case 'compliance':
      case 'files': {
        const value = submission[formElement.name]
        if (!value) {
          break
        }

        switch (formElement.type) {
          case 'camera':
          case 'draw': {
            const attachment = asSubmissionAttachmentDetail(value)
            if (attachment) {
              submissionAttachmentDetails.push(attachment)
            }
            break
          }
          case 'arcGISWebMap': {
            const arcGISWebMapElementValue =
              value as ArcGISTypes.ArcGISWebMapElementValue
            const files = arcGISWebMapElementValue.snapshotImages
            if (Array.isArray(files)) {
              for (let index = 0; index < files.length; index++) {
                const attachment = asSubmissionAttachmentDetail(files[index])
                if (attachment) {
                  submissionAttachmentDetails.push(attachment)
                }
              }
            }
            break
          }
          case 'compliance': {
            const files = (value as Record<string, unknown> | undefined)?.files
            if (Array.isArray(files)) {
              for (let index = 0; index < files.length; index++) {
                const attachment = asSubmissionAttachmentDetail(files[index])
                if (attachment) {
                  submissionAttachmentDetails.push(attachment)
                }
              }
            }
            break
          }
          case 'files': {
            if (Array.isArray(value)) {
              for (let index = 0; index < value.length; index++) {
                const attachment = asSubmissionAttachmentDetail(value[index])
                if (attachment) {
                  submissionAttachmentDetails.push(attachment)
                }
              }
            }
            break
          }
        }
      }
    }
  }

  return submissionAttachmentDetails
}

const asSubmissionAttachmentDetail = (
  value: unknown,
): null | SubmissionAttachmentDetail => {
  if (!value || typeof value !== 'object') {
    return null
  }
  const record = value as Record<string, unknown>
  // If the value matches the properties required for an attachment
  // that was never uploaded, we need to upload it.
  if (
    typeof record.type === 'string' &&
    typeof record.fileName === 'string' &&
    typeof record._id === 'string'
  ) {
    return {
      needsToUpload: true,
      value: record as unknown as AttachmentUnsaved,
    }
  } else {
    // Already uploaded
    return {
      needsToUpload: false,
      value: value as AttachmentSaved,
    }
  }
}
