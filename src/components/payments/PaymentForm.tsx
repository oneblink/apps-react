import { paymentService } from '../../apps'
import { SubmissionTypes } from '@oneblink/types'
import React from 'react'
import useLoadDataState from '../../hooks/useLoadDataState'
import OnLoading from '../renderer/OnLoading'
import MaterialIcon from '../MaterialIcon'
import { CaptchaType } from '../../types/form'
import SessionPaymentForm from './SessionPaymentForm'

/**
 * Renders the in-app payment form for a form submission. Reads the payment
 * session from the page URL and the submission result from local storage, then
 * renders `<SessionPaymentForm />`. `onCompleted` and `onCancelled` receive the
 * receipt URL for that submission.
 */
function PaymentForm({
  captchaSiteKey,
  captchaType,
  onCompleted,
  onCancelled,
  appImageUrl,
  title,
}: {
  captchaSiteKey: string
  captchaType?: CaptchaType
  onCompleted: (result: {
    formSubmissionPayment: SubmissionTypes.FormSubmissionPayment
    paymentReceiptUrl: string
  }) => void
  onCancelled: (result: { paymentReceiptUrl: string }) => void
  appImageUrl?: string
  title?: string
}) {
  const loadPayment = React.useCallback(async () => {
    const session = paymentService.getPaymentFormSession(window.location.search)
    const { formSubmissionResult } =
      await paymentService.getFormSubmissionResultPayment()
    const paymentType = formSubmissionResult.payment?.submissionEvent.type
    if (
      !paymentType ||
      !paymentService.paymentProviderRendersInApp(paymentType)
    ) {
      throw new Error(
        `"${paymentType}" payment events do not support a custom payment form.`,
      )
    }
    return { session, formSubmissionResult }
  }, [])

  const [state] = useLoadDataState(loadPayment)

  switch (state.status) {
    case 'LOADING': {
      return (
        <section>
          <div className="cypress-loading has-text-centered">
            <OnLoading className="has-text-centered"></OnLoading>
            <span>Loading payment configuration...</span>
          </div>
        </section>
      )
    }
    case 'ERROR': {
      return (
        <section
          className="cypress-payment-form-loading-error-message"
          role="alert"
        >
          <div className="ob-payment-form__error-icon-container has-text-centered has-margin-bottom-8">
            <MaterialIcon className="ob-payment-form__error-icon has-text-danger icon-x-large">
              error
            </MaterialIcon>
          </div>
          <p className="ob-payment-form__error-message has-text-centered has-margin-bottom-4">
            {state.error.message}
          </p>
        </section>
      )
    }
    case 'SUCCESS': {
      return (
        <SubmissionPaymentForm
          session={state.result.session}
          formSubmissionResult={state.result.formSubmissionResult}
          captchaSiteKey={captchaSiteKey}
          captchaType={captchaType}
          onCompleted={onCompleted}
          onCancelled={onCancelled}
          appImageUrl={appImageUrl}
          title={title}
        />
      )
    }
  }
}

function SubmissionPaymentForm({
  session,
  formSubmissionResult,
  captchaSiteKey,
  captchaType,
  onCompleted,
  onCancelled,
  appImageUrl,
  title,
}: {
  session: paymentService.PaymentFormSession
  formSubmissionResult: Parameters<
    typeof paymentService.getCancelledPaymentReceiptUrl
  >[0]
  captchaSiteKey: string
  captchaType?: CaptchaType
  onCompleted: (result: {
    formSubmissionPayment: SubmissionTypes.FormSubmissionPayment
    paymentReceiptUrl: string
  }) => void
  onCancelled: (result: { paymentReceiptUrl: string }) => void
  appImageUrl?: string
  title?: string
}) {
  const handleCompleted = React.useCallback(
    ({
      formSubmissionPayment,
    }: {
      formSubmissionPayment: SubmissionTypes.FormSubmissionPayment
    }) => {
      onCompleted({
        formSubmissionPayment,
        paymentReceiptUrl: paymentService.getCompletedPaymentReceiptUrl({
          formSubmissionResult,
          formSubmissionPayment,
        }),
      })
    },
    [formSubmissionResult, onCompleted],
  )

  const handleCancelled = React.useCallback(() => {
    onCancelled({
      paymentReceiptUrl: paymentService.getCancelledPaymentReceiptUrl(
        formSubmissionResult,
        session.formSubmissionPaymentId,
      ),
    })
  }, [formSubmissionResult, onCancelled, session.formSubmissionPaymentId])

  return (
    <SessionPaymentForm
      session={session}
      captchaSiteKey={captchaSiteKey}
      captchaType={captchaType}
      onCompleted={handleCompleted}
      onCancelled={handleCancelled}
      appImageUrl={appImageUrl}
      title={title}
    />
  )
}

export default React.memo(PaymentForm)
