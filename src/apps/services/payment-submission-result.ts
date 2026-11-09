import utilsService from './utils'
import { FormSubmissionResult } from '../types/submissions'

const PAYMENT_SUBMISSION_RESULT_KEY = 'PAYMENT_SUBMISSION_RESULT'

/** Read the payment stored for the receipt page. `null` when nothing is stored. */
export async function retrieveFormSubmissionResult(): Promise<FormSubmissionResult | null> {
  return await utilsService.getLocalForageItem<FormSubmissionResult | null>(
    PAYMENT_SUBMISSION_RESULT_KEY,
  )
}

/** Store a payment so the receipt page can verify it after the provider redirects back. */
export async function rememberPaymentSubmissionResult(
  formSubmissionResult: FormSubmissionResult,
): Promise<void> {
  await utilsService.setLocalForageItem(
    PAYMENT_SUBMISSION_RESULT_KEY,
    formSubmissionResult,
  )
}
