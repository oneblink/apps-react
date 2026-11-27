import { SubmissionEventTypes, SubmissionTypes } from '@oneblink/types'
import { PaymentProvider } from '../../types/payments'
import { FormSubmissionResult } from '../../types/submissions'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import { verifyPaymentTransaction } from '../api/payment'
import { localisationService } from '../..'
import {
  generateAmountReceiptItem,
  generateCreditCardMaskReceiptItem,
  generateReceiptItem,
  generateSubmissionIdReceiptItem,
  prepareReceiptItems,
} from './receipt-items'

/**
 * The Checkout Session returned live from Stripe by the OneBlink API. Unlike a
 * session stored on a completed payment, the PaymentIntent is `null` until the
 * customer submits a payment and its latest Charge is `null` until a payment
 * has been attempted.
 */
type LiveStripeCheckoutSession = Omit<
  SubmissionTypes.StripeCheckoutSession,
  'payment_intent'
> & {
  payment_intent:
    | (Omit<SubmissionTypes.StripePaymentIntent, 'latest_charge'> & {
        latest_charge: SubmissionTypes.StripeCharge | null
      })
    | null
}

/**
 * The user is sent to Stripe Hosted Checkout and returned to the app with the
 * ID of the form submission payment (`paymentId`) in the query string, whether
 * they paid or cancelled. The Checkout Session is requested live from Stripe
 * through the OneBlink API to display the receipt, similar to BPOINT and CP
 * Pay. The webhook is what updates the payment, so the receipt does not wait on
 * it.
 */
class StripePaymentProvider implements PaymentProvider<SubmissionEventTypes.StripeSubmissionEvent> {
  constructor(
    paymentSubmissionEvent: SubmissionEventTypes.StripeSubmissionEvent,
    formSubmissionResult: FormSubmissionResult,
  ) {
    this.paymentSubmissionEvent = paymentSubmissionEvent
    this.formSubmissionResult = formSubmissionResult
  }

  paymentSubmissionEvent: SubmissionEventTypes.StripeSubmissionEvent
  formSubmissionResult: FormSubmissionResult

  async verifyPaymentTransaction(query: Record<string, unknown>) {
    const { paymentId } = query
    if (typeof paymentId !== 'string' || !paymentId) {
      throw new OneBlinkAppsError(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
    }

    const checkoutSession =
      await verifyPaymentTransaction<LiveStripeCheckoutSession>(
        `/forms/${this.formSubmissionResult.definition.id}/stripe-verification`,
        { paymentId },
      )
    // Make sure the payment is for the submission that this receipt is being
    // shown for
    if (
      !checkoutSession.client_reference_id ||
      this.formSubmissionResult.submissionId !==
        checkoutSession.client_reference_id
    ) {
      throw new OneBlinkAppsError(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    }

    // The `success_url` and `cancel_url` are the same, so the session is the
    // only way to tell them apart. A customer that cancels returns without
    // completing the session, which leaves it open (or expired).
    const isComplete = checkoutSession.status === 'complete'
    // A complete session is unpaid while a delayed payment is still being
    // processed. The API only allows card payments, which are never delayed, so
    // this is a safeguard in case other payment methods are allowed.
    const isPending = isComplete && checkoutSession.payment_status === 'unpaid'
    const amountTotal = checkoutSession.amount_total
    const cardLast4Digits =
      checkoutSession.payment_intent?.latest_charge?.payment_method_details
        ?.card?.last4

    return {
      receiptItems: prepareReceiptItems([
        generateSubmissionIdReceiptItem(this.formSubmissionResult.submissionId),
        generateReceiptItem({
          className: 'ob-payment-receipt__payment-reference',
          valueClassName: 'cypress-payment-receipt-payment-reference',
          icon: 'shopping_cart',
          label: 'Payment Reference',
          value: checkoutSession.id,
          allowCopyToClipboard: true,
        }),
        generateReceiptItem({
          className: 'ob-payment-receipt__customer-email',
          valueClassName: 'cypress-payment-receipt-customer-email',
          icon: 'mail',
          label: 'Customer Email',
          value: checkoutSession.customer_details?.email,
          allowCopyToClipboard: false,
        }),
        generateReceiptItem({
          className: 'ob-payment-receipt__date',
          valueClassName: 'cypress-payment-receipt-date',
          icon: 'schedule',
          label: 'Date',
          value: formatCreatedDate(checkoutSession.created),
          allowCopyToClipboard: false,
        }),
        isPending
          ? {
              className: 'ob-payment-receipt__payment-status',
              valueClassName: 'cypress-payment-receipt-payment-status',
              icon: 'hourglass_empty',
              label: 'Payment Status',
              value: 'Pending',
              allowCopyToClipboard: false,
            }
          : undefined,
        generateCreditCardMaskReceiptItem(
          cardLast4Digits ? `xxxx xxxx xxxx ${cardLast4Digits}` : null,
        ),
        // Stripe amounts are in the smallest currency unit (e.g. cents)
        generateAmountReceiptItem(
          typeof amountTotal === 'number' ? amountTotal / 100 : undefined,
        ),
      ]),
      transaction: {
        isSuccess: isComplete,
        errorMessage: isComplete ? undefined : 'Payment Cancelled',
      },
      submissionResult: this.formSubmissionResult,
    }
  }
}

/** Stripe timestamps are in seconds since the Unix epoch */
function formatCreatedDate(created: number) {
  return localisationService.formatDatetimeLong(new Date(created * 1000))
}

export default StripePaymentProvider
