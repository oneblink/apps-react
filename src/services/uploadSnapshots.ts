import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { attachmentsService } from '@oneblink/apps'

async function uploadSnapshotsForSubmission({
  formId,
  formElements,
  submission,
}: {
  formId: number
  formElements: FormTypes.FormElement[]
  submission: SubmissionTypes.S3SubmissionData['submission']
}): Promise<void> {
  await Promise.all(
    formElements.map(async (formElement) => {
      switch (formElement.type) {
        case 'section':
        case 'page': {
          return await uploadSnapshotsForSubmission({
            formId,
            formElements: formElement.elements,
            submission,
          })
        }
        case 'form': {
          const nestedSubmission = submission[formElement.name]
          if (!nestedSubmission || typeof nestedSubmission !== 'object') {
            break
          }
          return await uploadSnapshotsForSubmission({
            formId,
            formElements: formElement.elements || [],
            submission:
              nestedSubmission as SubmissionTypes.S3SubmissionData['submission'],
          })
        }
        case 'repeatableSet': {
          const entries = submission[formElement.name]
          if (!Array.isArray(entries)) {
            break
          }
          return await Promise.all(
            entries.flatMap((entry) => {
              return uploadSnapshotsForSubmission({
                formId,
                formElements: formElement.elements,
                submission: entry,
              })
            }),
          )
        }
        case 'arcGISWebMap': {
          const value = submission[formElement.name]
          // @ts-expect-error - POC
          if (!value?.snapshot) {
            break
          }

          const attachment = await attachmentsService.uploadAttachment({
            formId,
            // @ts-expect-error - POC
            ...value.snapshot,
          })

          // @ts-expect-error - POC
          value.snapshot = attachment
          return
        }
      }
    }),
  )
}

export default async function uploadSnapshots(
  form: FormTypes.Form,
  submission: SubmissionTypes.S3SubmissionData['submission'],
): Promise<void> {
  await uploadSnapshotsForSubmission({
    formId: form.id,
    formElements: form.elements,
    submission,
  })
}
