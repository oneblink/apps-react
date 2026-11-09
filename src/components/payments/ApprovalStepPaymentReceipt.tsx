import * as React from 'react'
import { approvalsService, paymentService, submissionService } from '../../apps'
import SessionPaymentReceipt from './SessionPaymentReceipt'

function ApprovalStepPaymentReceipt({
  approvalId,
  onDone,
  onCancel,
}: {
  /** The approval step this receipt belongs to. */
  approvalId: string
  /** Called when the user clicks Done. */
  onDone: () => Promise<void>
  /** Called when the user clicks Cancel. */
  onCancel: () => Promise<void>
}) {
  const handleTryAgain = React.useCallback(
    async (submissionResult: submissionService.FormSubmissionResult) => {
      if (!submissionResult.submissionId || !submissionResult.payment) {
        throw new Error('This payment cannot be retried.')
      }

      const result = await approvalsService.createApprovalStepPayment(
        approvalId,
        {
          redirectUrl: submissionResult.payment.paymentReceiptUrl,
          paymentFormUrl: submissionResult.payment.paymentFormUrl,
          form: submissionResult.definition,
          submissionId: submissionResult.submissionId,
        },
      )
      window.location.assign(
        paymentService.getPaymentHandoff({
          hostedFormUrl: result.hostedFormUrl,
          paymentSubmissionEvent: result.paymentSubmissionEvent,
          formId: submissionResult.definition.id,
          amount: result.amount,
          customerReferenceNumber: result.customerReferenceNumber,
        }),
      )
    },
    [approvalId],
  )

  return (
    <SessionPaymentReceipt
      onDone={onDone}
      onCancel={onCancel}
      onTryAgain={handleTryAgain}
    />
  )
}

/**
 * Component for rendering an approval step payment receipt. Try Again starts
 * another payment for the same approval step. The developer implements what
 * happens when the user clicks 'Done' or 'Cancel'.
 *
 * It is also recommended to import the `css` from this library as well.
 *
 * ```js
 * import { ApprovalStepPaymentReceipt } from '@oneblink/apps-react'
 * import '@oneblink/apps-react/dist/styles.css'
 * ```
 *
 * #### Example
 *
 * ```tsx
 * import React from 'react'
 * import ReactDOM from 'react-dom'
 * import { ApprovalStepPaymentReceipt } from '@oneblink/apps-react'
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
 *   return (
 *     <ApprovalStepPaymentReceipt
 *       approvalId="d27966cc-128d-48a2-b681-6ad52012e113"
 *       onDone={handleDone}
 *       onCancel={handleCancel}
 *     />
 *   )
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
export default React.memo(ApprovalStepPaymentReceipt)
