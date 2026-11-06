import { paymentService } from '../../apps'
import { SubmissionTypes } from '@oneblink/types'
import React from 'react'
import WestpacQuickStreamPaymentForm from './WestpacQuickStreamPaymentForm'
import useLoadDataState from '../../hooks/useLoadDataState'
import OnLoading from '../renderer/OnLoading'
import MaterialIcon from '../MaterialIcon'
import { CaptchaType } from '../../types/form'
import type { PaymentFormSession } from '../../apps/services/payment-handoff'

/**
 * Renders the payment form for a payment that is taken inside the application
 * (for example Westpac QuickStream). The payment session is provided by the
 * application, so the form does not depend on where the payment was started.
 */
function SessionPaymentForm({
  session,
  captchaSiteKey,
  captchaType,
  onCompleted,
  onCancelled,
  appImageUrl,
  title,
}: {
  session: PaymentFormSession
  /** When provided, a CAPTCHA is shown and must be completed to make the payment */
  captchaSiteKey?: string
  captchaType?: CaptchaType
  onCompleted: (result: {
    formSubmissionPayment: SubmissionTypes.FormSubmissionPayment
  }) => void
  onCancelled: () => void
  appImageUrl?: string
  title?: string
}) {
  const loadPaymentFormConfiguration = React.useCallback(
    async (abortSignal: AbortSignal) => {
      switch (session.paymentType) {
        case 'WESTPAC_QUICK_STREAM': {
          const { supplierBusinessCode, publishableApiKey, isTestMode } =
            await paymentService.westpacQuickStream.getPaymentFormConfiguration(
              {
                session,
                abortSignal,
              },
            )
          return {
            renderPaymentForm: () => (
              <WestpacQuickStreamPaymentForm
                session={session}
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
      }
    },
    [
      appImageUrl,
      captchaSiteKey,
      captchaType,
      onCancelled,
      onCompleted,
      session,
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

export default React.memo(SessionPaymentForm)
