import { paymentService } from '../../apps'
import { SubmissionTypes } from '@oneblink/types'
import React from 'react'
import WestpacQuickStreamPaymentForm from './WestpacQuickStreamPaymentForm'
import useQuery from '../../hooks/useQuery'
import useLoadDataState from '../../hooks/useLoadDataState'
import OnLoading from '../renderer/OnLoading'
import MaterialIcon from '../MaterialIcon'
import { CaptchaType } from '../../types/form'

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
  const query = useQuery()

  const loadPaymentFormConfiguration = React.useCallback(
    async (abortSignal: AbortSignal) => {
      const formSubmissionPaymentId = query.formSubmissionPaymentId
      if (typeof formSubmissionPaymentId !== 'string') {
        throw new Error(
          'It looks like you are attempting to make an unknown payment.',
        )
      }

      const { formSubmissionResult, paymentSubmissionEvent } =
        await paymentService.getFormSubmissionResultPayment()
      switch (paymentSubmissionEvent.type) {
        case 'WESTPAC_QUICK_STREAM': {
          const { supplierBusinessCode, publishableApiKey, isTestMode } =
            await paymentService.westpacQuickStream.getPaymentFormConfiguration(
              {
                formSubmissionPaymentId,
                formSubmissionResult,
                paymentSubmissionEvent,
                abortSignal,
              },
            )
          return {
            renderPaymentForm: () => (
              <WestpacQuickStreamPaymentForm
                formSubmissionResult={formSubmissionResult}
                paymentSubmissionEvent={paymentSubmissionEvent}
                formSubmissionPaymentId={formSubmissionPaymentId}
                supplierBusinessCode={supplierBusinessCode}
                publishableApiKey={publishableApiKey}
                isTestMode={isTestMode}
                captchaSiteKey={captchaSiteKey}
                captchaType={captchaType}
                onCompleted={onCompleted}
                onCancelled={onCancelled}
                appImageUrl={appImageUrl}
                title={title}
              />
            ),
          }
        }
        default: {
          throw new Error(
            `"${paymentSubmissionEvent.type}" payment events do not support a custom payment form.`,
          )
        }
      }
    },
    [
      appImageUrl,
      captchaSiteKey,
      captchaType,
      onCancelled,
      onCompleted,
      query.formSubmissionPaymentId,
      title,
    ],
  )

  const [state] = useLoadDataState(loadPaymentFormConfiguration)

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
      return state.result.renderPaymentForm()
    }
  }
}

export default React.memo(PaymentForm)
