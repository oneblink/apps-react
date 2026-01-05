import { FormSubmission } from '../types/submissions'
import serverRequest from './serverRequest'
import OneBlinkAppsError from './errors/oneBlinkAppsError'
import generateReceiptId from './api/receipt-id'

export default async function externalIdGeneration(
  formSubmission: FormSubmission,
): Promise<{
  externalId: string | null
}> {
  if (
    formSubmission.definition.externalIdGenerationOnSubmit?.type ===
    'RECEIPT_ID'
  ) {
    if (formSubmission.externalId) {
      console.log(
        'Skipping generating an externalId based on receipt components and using',
        formSubmission.externalId,
      )
      return {
        externalId: formSubmission.externalId,
      }
    }
    return {
      externalId: await generateReceiptId(formSubmission.definition.id),
    }
  }

  const result = await serverRequest(
    formSubmission.definition.externalIdGenerationOnSubmit,
    {
      externalIdUrlSearchParam: formSubmission.externalId,
      formsAppId: formSubmission.formsAppId,
      formId: formSubmission.definition.id,
      draftId: formSubmission.formSubmissionDraftId || null,
      preFillFormDataId: formSubmission.preFillFormDataId,
      jobId: formSubmission.jobId,
      previousFormSubmissionApprovalId:
        formSubmission.previousFormSubmissionApprovalId ?? null,
      submission: formSubmission.submission,
    },
  )
  if (!result) {
    console.log(
      'Skipping generating an externalId based on URL and using',
      formSubmission.externalId,
    )
    return {
      externalId: formSubmission.externalId || null,
    }
  }
  const { url, response } = result

  if (!response.ok) {
    const data = await response.text()
    console.log(
      'Response from form generate externalId endpoint:',
      url,
      response.status,
      data,
    )
    let json: ReturnType<typeof JSON.parse>
    try {
      json = JSON.parse(data)
    } catch (err) {
      // Nothing
    }
    if (response.status === 400 && json && json.message) {
      throw new OneBlinkAppsError(json.message, {
        httpStatusCode: response.status,
      })
    }
    throw new OneBlinkAppsError(
      'Receipt generation failed. We received an invalid response from the receipt generation url.',
      {
        originalError: new Error(data),
        httpStatusCode: response.status,
      },
    )
  }

  const data = await response.json()
  console.log('Generated externalId from URL', url, data)
  return data
}
