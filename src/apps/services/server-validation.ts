import serverRequest from './serverRequest'
import { FormSubmission } from '../submission-service'
import Sentry from '../Sentry'
import OneBlinkAppsError from './errors/oneBlinkAppsError'

export default async function serverValidateForm(
  formSubmission: FormSubmission,
) {
  const result = await serverRequest(
    formSubmission.definition.serverValidation,
    {
      ...formSubmission,
      captchaTokens: undefined,
      definition: undefined,
      formId: formSubmission.definition.id,
    },
  )
  if (!result) return
  const { url, response } = result

  const data = await response.text()
  console.log(
    'Response from form validation endpoint:',
    url,
    response.status,
    data,
  )

  if (!response.ok) {
    Sentry.captureException(
      new Error(
        `Received ${response.status} status code from form validation endpoint`,
      ),
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
      'Form validation failed. We received an invalid response from the validation url',
      {
        originalError: new Error(data),
        httpStatusCode: response.status,
      },
    )
  }
}
