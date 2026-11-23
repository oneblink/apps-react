const STORAGE_KEY_PREFIX = 'PAYMENT_REQUEST_TOKEN:'

function storageKey(submissionId: string) {
  return `${STORAGE_KEY_PREFIX}${submissionId}`
}

/**
 * Keep the payment request token for the tab while the payer is at the payment
 * provider, so "Try Again" on the receipt can start another payment for the
 * same payment request. The payer is not the submitter, so the payment cannot
 * be started any other way. Session storage is cleared when the tab is closed.
 */
export function rememberPaymentRequestToken(
  submissionId: string,
  paymentRequestToken: string,
): void {
  sessionStorage.setItem(storageKey(submissionId), paymentRequestToken)
}

/** `undefined` when the payment was not started from a payment request. */
export function getRememberedPaymentRequestToken(
  submissionId: string | null | undefined,
): string | undefined {
  if (!submissionId) {
    return undefined
  }
  return sessionStorage.getItem(storageKey(submissionId)) || undefined
}

export function forgetPaymentRequestToken(
  submissionId: string | null | undefined,
): void {
  if (!submissionId) {
    return
  }
  sessionStorage.removeItem(storageKey(submissionId))
}
