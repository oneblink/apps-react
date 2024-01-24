import {
  OneBlinkAppsError,
  paymentService,
  submissionService,
  localisationService,
} from '@oneblink/apps'
import { SubmissionTypes, SubmissionEventTypes } from '@oneblink/types'
import clsx from 'clsx'
import React from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import OnLoading from '../renderer/OnLoading'
import OneBlinkAppsErrorOriginalMessage from '../renderer/OneBlinkAppsErrorOriginalMessage'
import Modal from '../renderer/Modal'

interface TrustedFrame {
  submitForm(
    callback: (
      errors:
        | Array<{
            fieldName: string
            messages: string[]
          }>
        | undefined,
      data: {
        singleUseToken: {
          singleUseTokenId: string
        }
      },
    ) => void,
  ): void
}

declare global {
  interface Window {
    QuickstreamAPI: {
      init(options: { publishableApiKey: string }): void
      creditCards: {
        createTrustedFrame(
          options: unknown,
          callback: (
            errors:
              | Array<{
                  fieldName: string
                  messages: string[]
                }>
              | undefined,
            data: {
              trustedFrame: TrustedFrame
            },
          ) => void,
        ): void
      }
    }
  }
}

function WestpacQuickStreamPaymentForm({
  formSubmissionResult,
  paymentSubmissionEvent,
  formSubmissionPaymentId,
  supplierBusinessCode,
  publishableApiKey,
  isTestMode,
  captchaSiteKey,
  onCompleted,
  onCancelled,
}: {
  formSubmissionResult: submissionService.FormSubmissionResult
  paymentSubmissionEvent: SubmissionEventTypes.WestpacQuickStreamSubmissionEvent
  formSubmissionPaymentId: string
  supplierBusinessCode: string
  publishableApiKey: string
  isTestMode: boolean
  captchaSiteKey: string
  onCompleted: (result: {
    formSubmissionPayment: SubmissionTypes.FormSubmissionPayment
    paymentReceiptUrl: string
  }) => void
  onCancelled: (result: { paymentReceiptUrl: string }) => void
}) {
  const [
    {
      isCompletingTransaction,
      completeTransactionError,
      captchaToken,
      displayCaptchaRequired,
    },
    setCompleteTransactionState,
  ] = React.useState<{
    captchaToken: string | null
    displayCaptchaRequired: boolean
    isCompletingTransaction: boolean
    completeTransactionError: Error | null
  }>({
    isCompletingTransaction: false,
    completeTransactionError: null,
    captchaToken: null,
    displayCaptchaRequired: false,
  })

  const clearCompleteTransactionError = React.useCallback(() => {
    setCompleteTransactionState((currentState) => ({
      ...currentState,
      isCompletingTransaction: false,
      completeTransactionError: null,
    }))
  }, [])

  const [{ trustedFrame, isLoading, loadError }, setLoadState] =
    React.useState<{
      trustedFrame: TrustedFrame | null
      isLoading: boolean
      loadError: Error | null
    }>({
      trustedFrame: null,
      isLoading: true,
      loadError: null,
    })

  React.useEffect(() => {
    const abortController = new AbortController()
    const scriptEle = document.createElement('script')
    scriptEle.type = 'text/javascript'
    scriptEle.async = true

    const run = async () => {
      try {
        scriptEle.src = isTestMode
          ? 'https://api.quickstream.support.qvalent.com/rest/v1/quickstream-api-1.0.min.js'
          : 'https://api.quickstream.westpac.com.au/rest/v1/quickstream-api-1.0.min.js'

        await new Promise((resolve, reject) => {
          try {
            scriptEle.addEventListener(
              'load',
              () => {
                resolve(undefined)
              },
              {
                signal: abortController.signal,
              },
            )

            scriptEle.addEventListener(
              'error',
              () => {
                reject(new Error(`Failed to load the script ${scriptEle.src}`))
              },
              {
                signal: abortController.signal,
              },
            )

            document.body.appendChild(scriptEle)
          } catch (error) {
            console.warn('Failed to load script', error)
            reject(error)
          }
        })

        window.QuickstreamAPI.init({
          publishableApiKey,
        })
        const newTrustedFrame = await new Promise<TrustedFrame>(
          (resolve, reject) => {
            window.QuickstreamAPI.creditCards.createTrustedFrame(
              {
                config: {
                  supplierBusinessCode,
                  threeDS2: true,
                },
                iframe: {
                  style: {
                    width: '100%',
                  },
                },
                showAcceptedCards: true,
                showRequiredIndicators: true,
              },
              (errors, data) => {
                if (errors) {
                  reject(errors)
                  return
                }
                resolve(data.trustedFrame)
              },
            )
          },
        )

        if (!abortController.signal.aborted) {
          setLoadState({
            trustedFrame: newTrustedFrame,
            isLoading: false,
            loadError: null,
          })
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          setLoadState({
            trustedFrame: null,
            isLoading: false,
            loadError: error as Error,
          })
        }
      }
    }

    run()

    return () => {
      abortController.abort()
      document.body.removeChild(scriptEle)
    }
  }, [isTestMode, publishableApiKey, supplierBusinessCode])

  const handleSubmit = React.useCallback(async () => {
    if (!trustedFrame) {
      return
    }

    if (!captchaToken) {
      setCompleteTransactionState({
        captchaToken: null,
        displayCaptchaRequired: true,
        isCompletingTransaction: false,
        completeTransactionError: null,
      })
      return
    }

    setCompleteTransactionState((currentState) => ({
      ...currentState,
      isCompletingTransaction: true,
      completeTransactionError: null,
    }))

    trustedFrame.submitForm((errors, data) => {
      if (errors) {
        console.log('Invalid payment form submission', errors)
        setCompleteTransactionState((currentState) => ({
          ...currentState,
          isCompletingTransaction: false,
          completeTransactionError: null,
        }))
        return
      }

      paymentService.westpacQuickStream
        .completeTransaction({
          singleUseTokenId: data.singleUseToken.singleUseTokenId,
          formSubmissionResult,
          formSubmissionPaymentId,
          paymentSubmissionEvent,
          captchaToken,
        })
        .then(onCompleted)
        .catch((error) => {
          setCompleteTransactionState((currentState) => ({
            ...currentState,
            isCompletingTransaction: false,
            completeTransactionError: error,
          }))
        })
    })
  }, [
    captchaToken,
    formSubmissionPaymentId,
    formSubmissionResult,
    onCompleted,
    paymentSubmissionEvent,
    trustedFrame,
  ])

  const [{ isCancellingTransaction, cancelError }, setCancelState] =
    React.useState<{
      isCancellingTransaction: boolean
      cancelError: Error | null
    }>({
      isCancellingTransaction: false,
      cancelError: null,
    })

  const clearCancelError = React.useCallback(() => {
    setCancelState({
      isCancellingTransaction: false,
      cancelError: null,
    })
  }, [])

  const handleCancel = React.useCallback(async () => {
    setCancelState({
      isCancellingTransaction: true,
      cancelError: null,
    })
    try {
      const result = await paymentService.westpacQuickStream.cancelPayment({
        formSubmissionPaymentId,
        formSubmissionResult,
      })
      onCancelled(result)
    } catch (error) {
      console.warn('Failed to cancel payment', error)
      setCancelState({
        isCancellingTransaction: false,
        cancelError: error as Error,
      })
    }
  }, [formSubmissionPaymentId, formSubmissionResult, onCancelled])

  return (
    <>
      {isLoading && (
        <section>
          <div className="cypress-loading has-text-centered">
            <OnLoading className="has-text-centered"></OnLoading>
            <span>Building payment form...</span>
          </div>
        </section>
      )}

      {loadError && (
        <section className="cypress-payment-form-loading-error-message">
          <div className="ob-payment-form__error-icon-container has-text-centered has-margin-bottom-8">
            <i className="ob-payment-form__error-icon material-icons has-text-danger icon-x-large">
              error
            </i>
          </div>
          <p className="ob-payment-form__error-message has-text-centered has-margin-bottom-4">
            {loadError.message}
          </p>
        </section>
      )}

      <section>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
        >
          <div className="ob-payment-form__westpac-quickstream-container">
            <div className="ob-payment-form__westpac-quickstream-amount">
              <div>Amount</div>
              <div>
                {localisationService.formatCurrency(
                  formSubmissionResult.payment?.amount ?? 0,
                )}
              </div>
            </div>
            <div
              data-quickstream-api="creditCardContainer"
              className="quickstream-credit-card-container"
            ></div>
          </div>
          {!isLoading && !loadError && (
            <>
              <ReCAPTCHA
                sitekey={captchaSiteKey}
                onChange={(newValue) => {
                  setCompleteTransactionState((currentState) => ({
                    ...currentState,
                    captchaToken: newValue,
                    displayCaptchaRequired: newValue === null,
                  }))
                }}
                className="ob-input cypress-captcha-control westpac-payment-captcha"
              />
              {displayCaptchaRequired && (
                <div role="alert" className="has-margin-top-8">
                  <div className="has-text-danger ob-error__text cypress-required cypress-validation-message">
                    Please complete the CAPTCHA successfully
                  </div>
                </div>
              )}

              <div className="payment-form-actions">
                <button
                  type="button"
                  disabled={isCompletingTransaction || isCancellingTransaction}
                  onClick={handleCancel}
                  className={clsx('button ob-button is-outlined', {
                    'is-loading': isCancellingTransaction,
                  })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompletingTransaction || isCancellingTransaction}
                  className={clsx('button ob-button is-success', {
                    'is-loading': isCompletingTransaction,
                  })}
                >
                  Make Payment
                </button>
              </div>
            </>
          )}
        </form>
      </section>

      <Modal
        isOpen={!!completeTransactionError}
        title="Payment Issue"
        className="cypress-payment-error-close-button"
        actions={
          <>
            <button
              type="button"
              className="button ob-button cypress-payment-error-close-button is-primary"
              onClick={clearCompleteTransactionError}
              autoFocus
            >
              Okay
            </button>
          </>
        }
      >
        <>
          <div>
            {completeTransactionError instanceof Error
              ? completeTransactionError.message
              : completeTransactionError}
          </div>
          {completeTransactionError instanceof OneBlinkAppsError && (
            <OneBlinkAppsErrorOriginalMessage
              error={completeTransactionError.originalError}
            />
          )}
        </>
      </Modal>

      <Modal
        isOpen={!!cancelError}
        title="Cancel Issue"
        className="cypress-cancel-error-close-button"
        actions={
          <>
            <button
              type="button"
              className="button ob-button cypress-cancel-error-close-button is-primary"
              onClick={clearCancelError}
              autoFocus
            >
              Okay
            </button>
          </>
        }
      >
        <>
          <div>
            {cancelError instanceof Error ? cancelError.message : cancelError}
          </div>
          {cancelError instanceof OneBlinkAppsError && (
            <OneBlinkAppsErrorOriginalMessage
              error={cancelError.originalError}
            />
          )}
        </>
      </Modal>
    </>
  )
}

export default React.memo(WestpacQuickStreamPaymentForm)
