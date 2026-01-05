import { SubmissionEventTypes, SubmissionTypes } from '@oneblink/types'
import { HTTPError, deleteRequest, getRequest, postRequest } from '../fetch'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import tenants from '../../tenants'
import Sentry from '../../Sentry'
import {
  BasePaymentConfigurationPayload,
  PaymentProvider,
} from '../../types/payments'
import { isOffline } from '../../offline-service'
import { NewFormSubmission } from '../../submission-service'

async function getCustomFormPaymentConfiguration<T>(
  path: string,
  {
    integrationEnvironmentId,
  }: {
    integrationEnvironmentId: string
  },
  abortSignal?: AbortSignal,
) {
  const url = new URL(path, tenants.current.apiOrigin)
  url.searchParams.append('integrationEnvironmentId', integrationEnvironmentId)

  console.log('Attempting to get payment configuration', url.href)

  try {
    return await getRequest<T>(url.href, abortSignal)
  } catch (err) {
    const error = err as HTTPError
    Sentry.captureException(error)
    console.warn(
      'Error occurred while attempting to retrieve configuration for payment',
      error,
    )
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot retrieve payment configuration until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access retrieve payment configuration. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the payment configuration. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

async function completeWestpacQuickStreamTransaction(
  formId: number,
  payload: {
    formSubmissionPaymentId: string
    singleUseTokenId: string
    integrationEnvironmentId: string
    customerReferenceNumber: string
    principalAmount: number
    recaptcha: NonNullable<NewFormSubmission['recaptchas']>[number]
  },
  abortSignal?: AbortSignal,
) {
  const url = `${tenants.current.apiOrigin}/forms/${formId}/westpac-quick-stream-transaction`
  console.log('Attempting to complete Westpac QuickStream transaction', url)
  try {
    return await postRequest<{
      formSubmissionPayment: SubmissionTypes.FormSubmissionPayment
    }>(url, payload, abortSignal)
  } catch (err) {
    const error = err as HTTPError
    Sentry.captureException(error)
    console.warn(
      'Error occurred while attempting to generate configuration for payment',
      error,
    )
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot complete transactions until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access complete transactions. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the configuration required to complete a transaction. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

async function cancelWestpacQuickStreamPayment(
  formId: number,
  formSubmissionPaymentId: string,
  abortSignal?: AbortSignal,
) {
  try {
    const url = `${tenants.current.apiOrigin}/forms/${formId}/westpac-quick-stream-payment/${formSubmissionPaymentId}`
    console.log('Attempting to cancel Westpac QuickStream payment', url)
    return await deleteRequest(url, abortSignal)
  } catch (error) {
    Sentry.captureException(error)

    const httpError = error as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet to continue',
        {
          originalError: httpError,
          isOffline: true,
        },
      )
    }
    switch (httpError.status) {
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the form you are looking for. Please contact support if the problem persists.',
          {
            originalError: httpError,
            title: 'Unknown Form',
            httpStatusCode: httpError.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: httpError,
            httpStatusCode: httpError.status,
          },
        )
      }
    }
  }
}

function generatePaymentConfiguration(
  paymentProvider: PaymentProvider<SubmissionEventTypes.FormPaymentEvent>,
  basePayload: BasePaymentConfigurationPayload,
): Promise<{ hostedFormUrl: string }> {
  const { path, payload } =
    paymentProvider.preparePaymentConfiguration(basePayload)
  const url = `${tenants.current.apiOrigin}${path}`
  console.log('Attempting to generate payment configuration', url)
  return postRequest<{ hostedFormUrl: string }>(url, payload).catch((error) => {
    Sentry.captureException(error)
    console.warn(
      'Error occurred while attempting to generate configuration for payment',
      error,
    )
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot make payments until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access make payments. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the configuration required to make a payment. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  })
}

const verifyPaymentTransaction = <T>(
  path: string,
  payload: unknown,
): Promise<T> => {
  const url = `${tenants.current.apiOrigin}${path}`
  console.log('Attempting to verify payment transaction', url)
  return postRequest<T>(url, payload).catch((error) => {
    Sentry.captureException(error)
    console.warn(
      'Error occurred while attempting to verify a transaction',
      error,
    )
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot verify a transaction until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to verify your transactions. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the configuration required to verify your transaction. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  })
}

const acknowledgeCPPayTransaction = async (
  formId: number,
  payload: unknown,
): Promise<void> => {
  const url = `${tenants.current.apiOrigin}/forms/${formId}/cp-pay-acknowledge`
  console.log('Attempting to acknowledge CP Pay transaction', url)
  await postRequest(url, payload).catch((error) => {
    Sentry.captureException(error)
    console.warn(
      'Error occurred while attempting to acknowledge a CP Pay transaction',
      error,
    )
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot acknowledge a transaction until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to acknowledge your transactions. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the configuration required to acknowledge your transaction. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  })
}

export {
  generatePaymentConfiguration,
  acknowledgeCPPayTransaction,
  verifyPaymentTransaction,
  getCustomFormPaymentConfiguration,
  completeWestpacQuickStreamTransaction,
  cancelWestpacQuickStreamPayment,
}
