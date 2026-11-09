import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { paymentService, submissionService } from './apps'
import SessionPaymentReceipt from './components/payments/SessionPaymentReceipt'

const { handlePaymentSubmissionEvent } = paymentService

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
  const history = useHistory()

  const handleDone = React.useCallback(
    async (submissionResult: submissionService.FormSubmissionResult) => {
      await onDone({ ...submissionResult, payment: null })
    },
    [onDone],
  )

  const handleCancel = React.useCallback(
    async (submissionResult: submissionService.FormSubmissionResult) => {
      await onCancel({ ...submissionResult, payment: null })
    },
    [onCancel],
  )

  const handleTryAgain = React.useCallback(
    async (submissionResult: submissionService.FormSubmissionResult) => {
      if (!submissionResult.payment) {
        return
      }

      const payment = await handlePaymentSubmissionEvent({
        formSubmissionResult: submissionResult,
        paymentReceiptUrl: submissionResult.payment.paymentReceiptUrl,
        paymentFormUrl: submissionResult.payment.paymentFormUrl,
      })
      // The API has decided that no payment is required on try again
      if (!payment) {
        await onDone({ ...submissionResult, payment: null })
        return
      }

      await submissionService.executePostSubmissionAction(
        { ...submissionResult, payment },
        {
          onRedirectToRelativeUrl: (url) => history.push(url),
          onRedirectToAbsoluteUrl: (url) => window.location.assign(url),
        },
      )
    },
    [history, onDone],
  )

  return (
    <SessionPaymentReceipt
      onDone={handleDone}
      onCancel={handleCancel}
      onTryAgain={handleTryAgain}
    />
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
