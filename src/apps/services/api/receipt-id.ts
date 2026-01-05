import tenants from '../../tenants'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import { HTTPError, postRequest } from '../fetch'

async function generateReceiptId(formId: number, abortSignal?: AbortSignal) {
  const url = `${tenants.current.apiOrigin}/forms/${formId}/receipt-id`
  try {
    const { receiptId } = await postRequest<{ receiptId: string }>(
      url,
      {},
      abortSignal,
    )
    return receiptId
  } catch (err) {
    console.warn(
      'Error occurred while attempting to generate External ID from API',
      err,
    )
    if (err instanceof OneBlinkAppsError) {
      throw err
    }

    const error = err as HTTPError
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot submit this form until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this form. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          },
        )
      }
      case 400: {
        throw new OneBlinkAppsError(error.message, {
          originalError: error,
          title: 'Error Generating Receipt',
          httpStatusCode: error.status,
        })
      }
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the form you are attempting to submit. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            title: 'Error Generating Receipt',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
          },
        )
      }
    }
  }
}

export default generateReceiptId
