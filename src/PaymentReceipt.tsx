import * as React from 'react'
import { useHistory } from 'react-router-dom'
import {
  paymentService,
  submissionService,
  localisationService,
  OneBlinkAppsError,
} from '@oneblink/apps'
import useIsMounted from './hooks/useIsMounted'

import useQuery from './hooks/useQuery'
import Modal from './components/renderer/Modal'
import OnLoading from './components/renderer/OnLoading'
import {
  Receipt,
  ReceiptList,
  ReceiptListItem,
  ReceiptButton,
} from './components/receipts'

const { handlePaymentQuerystring, handlePaymentSubmissionEvent } =
  paymentService

function PaymentReceipt({
  onDone,
}: {
  onDone: (
    submissionResult: submissionService.FormSubmissionResult,
  ) => void | Promise<void>
}) {
  const isMounted = useIsMounted()
  const query = useQuery()
  const history = useHistory()

  const [
    { isLoading, loadError, transaction, submissionResult },
    setLoadState,
  ] = React.useState<{
    isLoading: boolean
    loadError: Error | null
    transaction: paymentService.HandlePaymentResult['transaction'] | null
    submissionResult: submissionService.FormSubmissionResult | null
  }>({
    isLoading: true,
    loadError: null,
    transaction: null,
    submissionResult: null,
  })
  const [
    { isRunningPostSubmissionAction, postSubmissionError },
    setPostSubmissionState,
  ] = React.useState<{
    isRunningPostSubmissionAction: boolean
    postSubmissionError: OneBlinkAppsError | null
  }>({
    isRunningPostSubmissionAction: false,
    postSubmissionError: null,
  })
  const clearPostSubmissionError = React.useCallback(() => {
    setPostSubmissionState((currentState) => ({
      ...currentState,
      postSubmissionError: null,
    }))
  }, [])
  const [{ isRetrying, retryError }, setRetryState] = React.useState<{
    isRetrying: boolean
    retryError: OneBlinkAppsError | null
  }>({
    isRetrying: false,
    retryError: null,
  })
  const clearRetryError = React.useCallback(() => {
    setRetryState((currentState) => ({
      ...currentState,
      retryError: null,
    }))
  }, [])

  React.useEffect(() => {
    let ignore = false

    const getTransaction = async () => {
      let newError = null
      let newTransaction = null
      let newSubmissionResult = null
      try {
        const result = await handlePaymentQuerystring(query)
        newTransaction = result.transaction
        newSubmissionResult = result.submissionResult
      } catch (error) {
        console.warn('Error while attempting to load transaction', error)
        newError = error as Error
      }

      if (!ignore) {
        setLoadState({
          isLoading: false,
          loadError: newError,
          transaction: newTransaction,
          submissionResult: newSubmissionResult,
        })
      }
    }
    getTransaction()

    return () => {
      ignore = true
    }
  }, [query])

  const executePostSubmissionAction = React.useCallback(async () => {
    if (!submissionResult || !isMounted.current) {
      return
    }

    setPostSubmissionState({
      isRunningPostSubmissionAction: true,
      postSubmissionError: null,
    })

    let newError = null
    try {
      await onDone({ ...submissionResult, payment: null })
    } catch (error) {
      console.warn('Error while running post submission action', error)
      newError = error as OneBlinkAppsError
    }

    if (isMounted.current) {
      setPostSubmissionState({
        isRunningPostSubmissionAction: false,
        postSubmissionError: newError,
      })
    }
  }, [isMounted, submissionResult, onDone])

  const tryAgain = React.useCallback(async () => {
    if (!submissionResult || !submissionResult.payment) {
      return
    }
    const paymentSubmissionEvent = submissionResult.payment.submissionEvent

    if (isMounted.current) {
      setRetryState({
        isRetrying: true,
        retryError: null,
      })
    }

    let newError = null
    try {
      submissionResult.payment = await handlePaymentSubmissionEvent({
        amount: submissionResult.payment.amount,
        formSubmissionResult: submissionResult,
        paymentSubmissionEvent,
        paymentReceiptUrl: `${window.location.origin}${window.location.pathname}`,
      })
      await submissionService.executePostSubmissionAction(
        submissionResult,
        history.push,
      )
    } catch (error) {
      console.warn('Error while attempting to retry transaction', error)
      newError = error as OneBlinkAppsError
    }

    if (isMounted.current) {
      setRetryState({
        isRetrying: false,
        retryError: newError,
      })
    }
  }, [history.push, isMounted, submissionResult])

  return (
    <div>
      {isLoading && (
        <section>
          <div className="cypress-loading has-text-centered">
            <OnLoading className="has-text-centered"></OnLoading>
            <span>Retrieving transaction details...</span>
          </div>
        </section>
      )}

      {transaction && (
        <Receipt
          className="ob-payment-receipt"
          containerClassName="ob-payment-receipt__container"
        >
          <ReceiptList
            successIconClassName="ob-payment-receipt__success-icon"
            warningIconClassName="ob-payment-receipt__warning-icon"
            warningMessageClassName="ob-payment-receipt__warning-message cypress-payment-receipt-warning-message"
            warningMessage={
              transaction.isSuccess
                ? undefined
                : transaction.errorMessage || undefined
            }
          >
            {submissionResult && submissionResult.submissionId && (
              <ReceiptListItem
                className="ob-payment-receipt__submission-id"
                valueClassName="cypress-payment-receipt-submission-id"
                icon="receipt"
                label="Submission Id"
                value={submissionResult.submissionId}
                allowCopyToClipboard
              />
            )}

            {!!transaction.id && (
              <ReceiptListItem
                className="ob-payment-receipt__transaction-id"
                valueClassName="cypress-payment-receipt-transaction-id"
                icon="shopping_cart"
                label="Transaction Id"
                value={transaction.id}
                allowCopyToClipboard
              />
            )}

            {!!transaction.creditCardMask && (
              <ReceiptListItem
                className="ob-payment-receipt__card-number"
                valueClassName="cypress-payment-receipt-card-number"
                icon="credit_card"
                label="Card Number"
                value={transaction.creditCardMask}
              />
            )}

            {!!transaction.amount && (
              <ReceiptListItem
                className="ob-payment-receipt__amount"
                valueClassName="cypress-payment-receipt-amount"
                icon="attach_money"
                label="Amount"
                value={localisationService.formatCurrency(transaction.amount)}
              />
            )}
            <ReceiptListItem
              className="ob-payment-receipt__warning"
              valueClassName="cypress-payment-receipt-warning"
              label="Warning"
              value="Please do not click back in your browser, doing so will cause issues with your payment."
            />
          </ReceiptList>

          <div className="buttons">
            {transaction.isSuccess ? (
              <ReceiptButton
                className="is-primary ob-payment-receipt__button ob-payment-receipt__okay-button cypress-payment-receipt-okay-button"
                label="Done"
                isLoading={isRunningPostSubmissionAction}
                onClick={executePostSubmissionAction}
              />
            ) : (
              <>
                <ReceiptButton
                  className="ob-payment-receipt__button ob-payment-receipt__cancel-button cypress-payment-receipt-cancel-button"
                  label="Cancel"
                  isDisabled={isRetrying}
                  isLoading={isRunningPostSubmissionAction}
                  onClick={executePostSubmissionAction}
                />
                <ReceiptButton
                  className="is-primary ob-payment-receipt__button ob-payment-receipt__try-again-button cypress-payment-receipt-try-again-button"
                  label="Try Again"
                  isDisabled={isRunningPostSubmissionAction}
                  isLoading={isRetrying}
                  onClick={tryAgain}
                />
              </>
            )}
          </div>
        </Receipt>
      )}

      {loadError && (
        <section className="cypress-payment-receipt-loading-error-message">
          <div className="ob-payment-receipt__error-icon-container has-text-centered has-margin-bottom-8">
            <i className="ob-payment-receipt__error-icon material-icons has-text-danger icon-x-large">
              error
            </i>
          </div>
          <p className="ob-payment-receipt__error-message has-text-centered has-margin-bottom-4">
            {loadError.message}
          </p>
        </section>
      )}

      {retryError && (
        <Modal
          isOpen
          title={retryError.title || 'Whoops...'}
          bodyClassName="cypress-payment-receipt-retry-error-message"
          actions={
            <button
              type="button"
              className="button ob-button is-primary cypress-payment-receipt-retry-error-okay-button"
              onClick={clearRetryError}
            >
              Okay
            </button>
          }
        >
          {retryError.message}
        </Modal>
      )}

      {postSubmissionError && (
        <Modal
          isOpen
          title={postSubmissionError.title || 'Whoops...'}
          bodyClassName="cypress-payment-receipt-retry-error-message"
          actions={
            <button
              type="button"
              className="button ob-button is-primary cypress-payment-receipt-retry-error-okay-button"
              onClick={clearPostSubmissionError}
            >
              Okay
            </button>
          }
        >
          {postSubmissionError.message}
        </Modal>
      )}
    </div>
  )
}

export default React.memo(PaymentReceipt)
