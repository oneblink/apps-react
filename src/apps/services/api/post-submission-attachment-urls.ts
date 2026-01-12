import tenants from '../../tenants'
import { FormSubmissionResult } from '../../types/submissions'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import { getRequest } from '../fetch'
import generateGenericError from '../generate-generic-error'

const getPostSubmissionAttachments = async (
  formSumbissionResult: FormSubmissionResult,
) => {
  if (!formSumbissionResult.attachmentsAccessToken) {
    throw new OneBlinkAppsError(
      'No access token passed for fetching post-submission attachment URLs',
    )
  }
  try {
    const result = await getRequest<
      {
        signedUrl: string
        filename: string
        contentType: string
      }[]
    >(
      `${tenants.current.apiOrigin}/forms/${formSumbissionResult.definition.id}/submissions/${formSumbissionResult.submissionId}/attachment-urls?accessToken=${formSumbissionResult.attachmentsAccessToken}`,
    )
    return result
  } catch (err) {
    console.error(
      'Error occurred while attempting to get post-submission attachment URLs',
      err,
    )
    throw generateGenericError(err)
  }
}

export default getPostSubmissionAttachments
