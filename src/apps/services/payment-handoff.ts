import { SubmissionEventTypes } from '@oneblink/types'
import OneBlinkAppsError from './errors/oneBlinkAppsError'
import replaceInjectablesWithSubmissionValues from './replaceInjectablesWithSubmissionValues'
import { FormSubmissionResult } from '../types/submissions'

/**
 * Payment providers whose payment form is rendered by the application itself
 * (e.g. Westpac QuickStream). Every other provider redirects the user to a
 * payment form hosted by the provider.
 */
export type InAppPaymentType = 'WESTPAC_QUICK_STREAM'

/**
 * Everything an in-app payment form needs to take a payment. It is passed
 * between the application that creates the payment and the page that renders
 * the payment form as URL search parameters, so the page does not need to read
 * the submission from local storage.
 */
export type PaymentFormSession = {
  paymentType: InAppPaymentType
  formId: number
  formSubmissionPaymentId: string
  integrationEnvironmentId: string
  amount: number
  customerReferenceNumber: string
}

/**
 * `true` if the payment provider renders its payment form inside the
 * application instead of redirecting to a provider hosted form.
 */
export function paymentProviderRendersInApp(
  type: string,
): type is InAppPaymentType {
  return type === 'WESTPAC_QUICK_STREAM'
}

/**
 * Get the URL the user should be sent to in order to pay. Hosted providers
 * return the provider's hosted form URL. In-app providers return the
 * application's payment form URL with the payment session appended.
 */
export function getPaymentHandoff({
  hostedFormUrl,
  paymentSubmissionEvent,
  formId,
  amount,
  customerReferenceNumber,
}: {
  hostedFormUrl: string
  paymentSubmissionEvent: SubmissionEventTypes.FormPaymentEvent
  formId: number
  amount: number
  /** The resolved customer reference number. Falls back to the configured value. */
  customerReferenceNumber?: string
}): string {
  switch (paymentSubmissionEvent.type) {
    case 'WESTPAC_QUICK_STREAM': {
      const url = new URL(hostedFormUrl)
      url.searchParams.set('paymentType', paymentSubmissionEvent.type)
      url.searchParams.set('formId', String(formId))
      url.searchParams.set(
        'integrationEnvironmentId',
        paymentSubmissionEvent.configuration.environmentId,
      )
      url.searchParams.set('amount', String(amount))
      url.searchParams.set(
        'customerReferenceNumber',
        customerReferenceNumber ||
          paymentSubmissionEvent.configuration.customerReferenceNumber,
      )
      return url.href
    }
    default: {
      return hostedFormUrl
    }
  }
}

/** Get the payment handoff URL for a form submission that requires a payment. */
export function getFormSubmissionPaymentHandoff(
  formSubmissionResult: FormSubmissionResult,
): string {
  const payment = formSubmissionResult.payment
  if (!payment) {
    throw new Error(
      '"formSubmissionResult.payment" must have a value to create a payment handoff',
    )
  }

  const { submissionEvent } = payment
  return getPaymentHandoff({
    hostedFormUrl: payment.hostedFormUrl,
    paymentSubmissionEvent: submissionEvent,
    formId: formSubmissionResult.definition.id,
    amount: payment.amount,
    customerReferenceNumber:
      submissionEvent.type === 'WESTPAC_QUICK_STREAM'
        ? replaceInjectablesWithSubmissionValues(
            submissionEvent.configuration.customerReferenceNumber,
            formSubmissionResult,
          ).text
        : undefined,
  })
}

/**
 * Read the payment session from the search parameters of an in-app payment form
 * URL. Throws if the URL does not contain a complete session.
 */
export function getPaymentFormSession(
  search: string | URLSearchParams,
): PaymentFormSession {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search

  const paymentType = params.get('paymentType') || ''
  const formId = Number(params.get('formId'))
  const formSubmissionPaymentId = params.get('formSubmissionPaymentId') || ''
  const integrationEnvironmentId = params.get('integrationEnvironmentId') || ''
  const amount = Number(params.get('amount'))
  const customerReferenceNumber = params.get('customerReferenceNumber') || ''

  if (
    !paymentProviderRendersInApp(paymentType) ||
    !formId ||
    !formSubmissionPaymentId ||
    !integrationEnvironmentId ||
    !Number.isFinite(amount)
  ) {
    throw new OneBlinkAppsError('This payment link is missing details.', {
      title: 'Invalid Payment Link',
    })
  }

  return {
    paymentType,
    formId,
    formSubmissionPaymentId,
    integrationEnvironmentId,
    amount,
    customerReferenceNumber,
  }
}
