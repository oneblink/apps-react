import { ArcGISTypes, FormTypes, SubmissionTypes } from '@oneblink/types'
import { v4 as uuid } from 'uuid'
import { attachmentsService } from '../apps'

import { Value as FormElementComplianceValue } from '../form-elements/FormElementCompliance'

export function validateAttachmentExists(
  attachment: attachmentsService.Attachment,
  attachmentRetentionInDays: number | undefined,
): attachmentsService.AttachmentError | void {
  if (attachment.type || !attachment.uploadedAt || !attachmentRetentionInDays) {
    return
  }

  const uploadedAt = new Date(attachment.uploadedAt)
  const expiresAt = new Date(attachment.uploadedAt)
  expiresAt.setDate(uploadedAt.getDate() + attachmentRetentionInDays)
  const now = new Date()
  console.log('Checking if attachment still exists', {
    uploadedAt,
    expiresAt,
    attachment,
  })
  // check if attachment exists
  if (expiresAt > now) {
    return
  }

  const attachmentError: attachmentsService.AttachmentError = {
    type: 'ERROR',
    errorMessage:
      "This attachment has been removed based on your administrator's data retention policy, please remove it and upload it again.",
    _id: uuid(),
    fileName: attachment.fileName,
    isPrivate: attachment.isPrivate,
  }
  return attachmentError
}

function validateAttachmentsExists(
  attachments: unknown,
  attachmentRetentionInDays: number | undefined,
): attachmentsService.Attachment[] | void {
  if (!Array.isArray(attachments)) {
    return
  }
  const newAttachments = [...attachments]
  let hasChanges = false
  for (let index = 0; index < newAttachments.length; index++) {
    const attachmentError = validateAttachmentExists(
      newAttachments[index] as attachmentsService.Attachment,
      attachmentRetentionInDays,
    )
    if (attachmentError) {
      hasChanges = true
      newAttachments[index] = attachmentError
    }
  }
  if (hasChanges) {
    return newAttachments
  }
}

function checkIfAttachmentsExistForFormElements(
  formElements: FormTypes.FormElement[],
  submission: SubmissionTypes.S3SubmissionData['submission'],
  attachmentRetentionInDays: number | undefined,
): SubmissionTypes.S3SubmissionData['submission'] | void {
  const result: SubmissionTypes.S3SubmissionData['submission'] = {
    ...submission,
  }
  let hasChanges = false
  for (const formElement of formElements) {
    switch (formElement.type) {
      case 'section':
      case 'page': {
        const newSubmission = checkIfAttachmentsExistForFormElements(
          formElement.elements,
          result,
          attachmentRetentionInDays,
        )
        if (newSubmission) {
          hasChanges = true
          Object.assign(result, newSubmission)
        }
        break
      }
      case 'form': {
        const nestedSubmission = submission[formElement.name]
        if (!nestedSubmission || typeof nestedSubmission !== 'object') {
          break
        }
        const newSubmission = checkIfAttachmentsExistForFormElements(
          formElement.elements || [],
          nestedSubmission as SubmissionTypes.S3SubmissionData['submission'],
          attachmentRetentionInDays,
        )
        if (newSubmission) {
          hasChanges = true
          result[formElement.name] = newSubmission
        }
        break
      }
      case 'repeatableSet': {
        const entries = submission[formElement.name]
        if (!Array.isArray(entries)) {
          break
        }
        const newEntries = [...entries]
        let hasEntryChanges = false
        for (let index = 0; index < entries.length; index++) {
          const entry = entries[index]
          if (typeof entry === 'object') {
            const newEntry = checkIfAttachmentsExistForFormElements(
              formElement.elements,
              entry,
              attachmentRetentionInDays,
            )
            if (newEntry) {
              hasEntryChanges = true
              newEntries[index] = newEntry
            }
          }
        }
        if (hasEntryChanges) {
          hasChanges = true
          result[formElement.name] = newEntries
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

        // If the attachment has a type, it has not finished uploading
        switch (formElement.type) {
          case 'camera':
          case 'draw': {
            const attachmentError = validateAttachmentExists(
              value as attachmentsService.Attachment,
              attachmentRetentionInDays,
            )
            if (attachmentError) {
              hasChanges = true
              result[formElement.name] = attachmentError
            }
            break
          }
          case 'compliance': {
            const newAttachments = validateAttachmentsExists(
              (value as FormElementComplianceValue).files,
              attachmentRetentionInDays,
            )
            if (newAttachments) {
              hasChanges = true
              result[formElement.name] = {
                ...(value as FormElementComplianceValue),
                files: newAttachments,
              }
            }
            break
          }
          case 'files': {
            const newAttachments = validateAttachmentsExists(
              value,
              attachmentRetentionInDays,
            )
            if (newAttachments) {
              hasChanges = true
              result[formElement.name] = newAttachments
            }
            break
          }
          case 'arcGISWebMap': {
            const arcGISWebMapElementValue =
              value as ArcGISTypes.ArcGISWebMapElementValue
            const snapshotImages = validateAttachmentsExists(
              arcGISWebMapElementValue.snapshotImages,
              attachmentRetentionInDays,
            )
            if (snapshotImages) {
              hasChanges = true
              result[formElement.name] = {
                ...value,
                snapshotImages,
              }
            }
            break
          }
        }
      }
    }
  }
  if (hasChanges) {
    return result
  }
}

export default function checkIfAttachmentsExist(
  form: FormTypes.Form,
  submission: SubmissionTypes.S3SubmissionData['submission'],
  attachmentRetentionInDays: number | undefined,
): SubmissionTypes.S3SubmissionData['submission'] | void {
  return checkIfAttachmentsExistForFormElements(
    form.elements,
    submission,
    attachmentRetentionInDays,
  )
}
