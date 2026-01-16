import * as React from 'react'
import { useHistory } from 'react-router-dom'
import {
  paymentService,
  submissionService,
  OneBlinkAppsError,
  schedulingService,
  localisationService,
} from './apps'
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
import MaterialIcon from './components/MaterialIcon'
import DownloadableFiles from './components/downloadable-files'

const { handlePaymentQuerystring, handlePaymentSubmissionEvent } =
  paymentService

function PaymentReceipt({
  onDone,
  onCancel,
}: {
  /**
   * The function to call when the user clicks 'Done'. See
   * [FormSubmissionResult](https://oneblink.github.io/apps/modules/submissionService.html#FormSubmissionResult)
   * for the structure of the argument.
   */
  onDone: (
    submissionResult: submissionService.FormSubmissionResult,
  ) => Promise<void>
  /**
   * The function to call when the user clicks 'Cancel'. See
   * [FormSubmissionResult](https://oneblink.github.io/apps/modules/submissionService.html#FormSubmissionResult)
   * for the structure of the argument.
   */
  onCancel: (
    submissionResult: submissionService.FormSubmissionResult,
  ) => Promise<void>
}) {
  const isMounted = useIsMounted()
  const query = useQuery()
  const history = useHistory()

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
    submissionResult: submissionService.FormSubmissionResult | null
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

  const executePostSubmissionAction = React.useCallback(
    async (
      action: (
        submissionRresult: submissionService.FormSubmissionResult,
      ) => Promise<void>,
    ) => {
      if (!submissionResult || !isMounted.current) {
        return
      }

      setPostSubmissionState({
        isRunningPostSubmissionAction: true,
        postSubmissionError: null,
      })

      let newError = null
      try {
        await action({ ...submissionResult, payment: null })
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
    },
    [isMounted, submissionResult],
  )

  const handleDone = React.useCallback(async () => {
    executePostSubmissionAction(onDone)
  }, [executePostSubmissionAction, onDone])

  const handleCancel = React.useCallback(() => {
    executePostSubmissionAction(onCancel)
  }, [executePostSubmissionAction, onCancel])

  const handleTryAgain = React.useCallback(async () => {
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
      const payment = await handlePaymentSubmissionEvent({
        amount: submissionResult.payment.amount,
        formSubmissionResult: submissionResult,
        paymentSubmissionEvent,
        paymentReceiptUrl: submissionResult.payment.paymentReceiptUrl,
        paymentFormUrl: submissionResult.payment.paymentFormUrl,
      })
      await submissionService.executePostSubmissionAction({ ...submissionResult, payment }, {
        onRedirectToRelativeUrl: (url) => history.push(url),
        onRedirectToAbsoluteUrl: (url) => window.location.assign(url),
      })
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
  }, [history, isMounted, submissionResult])

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

/**
 * Component for rendering a OneBlink Form Payment Receipt. This component will
 * payment receipt but it is up to the developer to implement what happens when
 * the user clicks 'Done'.
 *
 * It is also recommended to import the `css` from this library as well.
 *
 * ```js
 * import { PaymentReceipt } from '@oneblink/apps-react'
 * import '@oneblink/apps-react/dist/styles.css'
 * ```
 *
 * #### Example
 *
 * ```tsx
 * import React from 'react'
 * import ReactDOM from 'react-dom'
 * import { PaymentReceipt } from '@oneblink/apps-react'
 * import '@oneblink/apps-react/dist/styles.css'
 *
 * function ReceiptContainer() {
 *   const handleDone = React.useCallback(async () => {
 *     console.log('All done!')
 *   }, [])
 *   const handleCancel = React.useCallback(async () => {
 *     console.log('Cancelled!')
 *   }, [])
 *
 *   return <PaymentReceipt onDone={handleDone} onCancel={handleCancel} />
 * }
 *
 * function App() {
 *   return (
 *     <IsOfflineContextProvider>
 *       <ReceiptContainer />
 *     </IsOfflineContextProvider>
 *   )
 * }
 *
 * const root = document.getElementById('root')
 * if (root) {
 *   ReactDOM.render(<App />, root)
 * }
 * ```
 *
 * @param props
 * @returns
 * @group Components
 */
export default React.memo(PaymentReceipt)
