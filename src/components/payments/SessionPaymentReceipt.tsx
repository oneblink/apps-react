import * as React from 'react'
import {
  paymentService,
  submissionService,
  OneBlinkAppsError,
  schedulingService,
  localisationService,
} from '../../apps'
import useIsMounted from '../../hooks/useIsMounted'
import useQuery from '../../hooks/useQuery'
import Modal from '../renderer/Modal'
import OnLoading from '../renderer/OnLoading'
import {
  Receipt,
  ReceiptList,
  ReceiptListItem,
  ReceiptButton,
} from '../receipts'
import MaterialIcon from '../MaterialIcon'
import QuillHTML from '../QuillHTML'
import DownloadableFiles from '../downloadable-files'
import replaceInjectablesWithSubmissionValues from '../../apps/services/replaceInjectablesWithSubmissionValues'

const { handlePaymentQuerystring } = paymentService

type SubmissionResult = submissionService.FormSubmissionResult

/**
 * Renders a payment receipt from the return URL. The application decides what
 * Done, Cancel, and Try Again do, so this does not assume the payment belongs
 * to a form submission.
 */
function SessionPaymentReceipt({
  onDone,
  onCancel,
  onTryAgain,
}: {
  onDone: (submissionResult: SubmissionResult) => Promise<void>
  onCancel: (submissionResult: SubmissionResult) => Promise<void>
  onTryAgain: (submissionResult: SubmissionResult) => Promise<void>
}) {
  const isMounted = useIsMounted()
  const query = useQuery()

  const [
    {
      isLoading,
      loadError,
      transaction,
      submissionResult,
      receiptItems,
      schedulingBooking,
    },
    setLoadState,
  ] = React.useState<{
    isLoading: boolean
    loadError: Error | null
    transaction: paymentService.HandlePaymentResult['transaction'] | null
    submissionResult: SubmissionResult | null
    receiptItems: paymentService.PaymentReceiptItem[] | null
    schedulingBooking: schedulingService.SchedulingBooking | null
  }>({
    isLoading: true,
    loadError: null,
    transaction: null,
    submissionResult: null,
    receiptItems: null,
    schedulingBooking: null,
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
      let newReceiptItems = null
      let newSchedulingBooking = null
      try {
        const result = await handlePaymentQuerystring(query)
        newTransaction = result.transaction
        newSubmissionResult = result.submissionResult
        newReceiptItems = result.receiptItems
        newSchedulingBooking = result.schedulingBooking ?? null
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
          receiptItems: newReceiptItems,
          schedulingBooking: newSchedulingBooking,
        })
      }
    }
    getTransaction()

    return () => {
      ignore = true
    }
  }, [query])

  const runAction = React.useCallback(
    async (
      action: (submissionResult: SubmissionResult) => Promise<void>,
      kind: 'post-submission' | 'retry',
    ) => {
      if (!submissionResult || !isMounted.current) {
        return
      }

      if (kind === 'retry') {
        setRetryState({ isRetrying: true, retryError: null })
      } else {
        setPostSubmissionState({
          isRunningPostSubmissionAction: true,
          postSubmissionError: null,
        })
      }

      let newError = null
      try {
        await action(submissionResult)
      } catch (error) {
        console.warn(
          kind === 'retry'
            ? 'Error while attempting to retry transaction'
            : 'Error while running post submission action',
          error,
        )
        newError = error as OneBlinkAppsError
      }

      if (!isMounted.current) {
        return
      }
      if (kind === 'retry') {
        setRetryState({ isRetrying: false, retryError: newError })
      } else {
        setPostSubmissionState({
          isRunningPostSubmissionAction: false,
          postSubmissionError: newError,
        })
      }
    },
    [isMounted, submissionResult],
  )

  const handleDone = React.useCallback(() => {
    runAction(onDone, 'post-submission')
  }, [onDone, runAction])

  const handleCancel = React.useCallback(() => {
    runAction(onCancel, 'post-submission')
  }, [onCancel, runAction])

  const handleTryAgain = React.useCallback(() => {
    runAction(onTryAgain, 'retry')
  }, [onTryAgain, runAction])

  const postSubmissionSuccessHtml = React.useMemo(() => {
    const html = submissionResult?.definition.postSubmissionReceipt?.html
    if (!transaction?.isSuccess || !submissionResult || !html) {
      return undefined
    }

    return replaceInjectablesWithSubmissionValues(html, submissionResult).text
  }, [submissionResult, transaction?.isSuccess])

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
            hideSuccessIcon={!!postSubmissionSuccessHtml}
          >
            {postSubmissionSuccessHtml && (
              <div className="ob-list__item ob-payment-receipt__success-message">
                <div className="ob-list__content-wrapper">
                  <div className="ob-list__content">
                    <QuillHTML
                      html={postSubmissionSuccessHtml}
                      className="cypress-payment-receipt-success-message"
                    />
                  </div>
                </div>
              </div>
            )}
            {receiptItems &&
              receiptItems.length &&
              receiptItems.map((receiptItem, i) => {
                return (
                  <ReceiptListItem
                    key={i}
                    className={receiptItem.className ?? ''}
                    valueClassName={receiptItem.valueClassName ?? ''}
                    icon={receiptItem.icon}
                    label={receiptItem.label}
                    value={receiptItem.value}
                    allowCopyToClipboard={receiptItem.allowCopyToClipboard}
                  />
                )
              })}
            {schedulingBooking && transaction.isSuccess && (
              <>
                {schedulingBooking.location && (
                  <ReceiptListItem
                    className="ob-scheduling-receipt__location"
                    valueClassName="cypress-scheduling-receipt-location"
                    icon="location_on"
                    label="Location"
                    value={schedulingBooking.location}
                  />
                )}

                <ReceiptListItem
                  className="ob-scheduling-receipt__start-time"
                  valueClassName="cypress-scheduling-receipt-start-time"
                  icon="schedule"
                  label="Start Time"
                  value={localisationService.formatDatetimeLong(
                    schedulingBooking.startTime,
                  )}
                />

                <ReceiptListItem
                  className="ob-scheduling-receipt__end-time"
                  valueClassName="cypress-scheduling-receipt-end-time"
                  icon="schedule"
                  label="End Time"
                  value={localisationService.formatDatetimeLong(
                    schedulingBooking.endTime,
                  )}
                />
              </>
            )}
            <ReceiptListItem
              className="ob-payment-receipt__warning"
              valueClassName="cypress-payment-receipt-warning"
              label="Warning"
              value="Please do not click back in your browser, doing so will cause issues with your payment."
            />
          </ReceiptList>

          {submissionResult && transaction.isSuccess && (
            <DownloadableFiles
              formSubmissionResult={submissionResult}
              layout="LIST"
            />
          )}

          <div className="buttons">
            {transaction.isSuccess ? (
              <ReceiptButton
                className="is-primary ob-payment-receipt__button ob-payment-receipt__okay-button cypress-payment-receipt-okay-button"
                label="Done"
                isLoading={isRunningPostSubmissionAction}
                onClick={handleDone}
              />
            ) : (
              <>
                <ReceiptButton
                  className="ob-payment-receipt__button ob-payment-receipt__cancel-button cypress-payment-receipt-cancel-button"
                  label="Cancel"
                  isDisabled={isRetrying}
                  isLoading={isRunningPostSubmissionAction}
                  onClick={handleCancel}
                />
                <ReceiptButton
                  className="is-primary ob-payment-receipt__button ob-payment-receipt__try-again-button cypress-payment-receipt-try-again-button"
                  label="Try Again"
                  isDisabled={isRunningPostSubmissionAction}
                  isLoading={isRetrying}
                  onClick={handleTryAgain}
                />
              </>
            )}
          </div>
        </Receipt>
      )}

      {loadError && (
        <section className="cypress-payment-receipt-loading-error-message">
          <div className="ob-payment-receipt__error-icon-container has-text-centered has-margin-bottom-8">
            <MaterialIcon className="ob-payment-receipt__error-icon has-text-danger icon-x-large">
              error
            </MaterialIcon>
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
              autoFocus
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
              autoFocus
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

export default React.memo(SessionPaymentReceipt)
