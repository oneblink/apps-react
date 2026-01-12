import { localisationService } from '../..'
import { PaymentReceiptItem } from '../../types/payments'

export function prepareReceiptItems(
  receiptItems: Array<PaymentReceiptItem | undefined>,
): PaymentReceiptItem[] {
  return receiptItems.reduce<PaymentReceiptItem[]>((memo, receiptItem) => {
    if (receiptItem) {
      memo.push(receiptItem)
    }
    return memo
  }, [])
}

export function generateSubmissionIdReceiptItem(
  submissionId: string | undefined | null,
): PaymentReceiptItem | undefined {
  if (!submissionId) {
    return undefined
  }
  return {
    className: 'ob-payment-receipt__submission-id',
    valueClassName: 'cypress-payment-receipt-submission-id',
    icon: 'receipt',
    label: 'Submission Id',
    value: submissionId,
    allowCopyToClipboard: true,
  }
}

export function generateCreditCardMaskReceiptItem(
  creditCardMask: string | undefined | null,
): PaymentReceiptItem | undefined {
  if (!creditCardMask) {
    return undefined
  }
  return {
    className: 'ob-payment-receipt__card-number',
    valueClassName: 'cypress-payment-receipt-card-number',
    icon: 'credit_card',
    label: 'Card Number',
    value: creditCardMask,
    allowCopyToClipboard: false,
  }
}

export function generateAmountReceiptItem(
  amount: number | undefined | null,
): PaymentReceiptItem | undefined {
  if (typeof amount !== 'number') {
    return undefined
  }
  return {
    className: 'ob-payment-receipt__amount',
    valueClassName: 'cypress-payment-receipt-amount',
    icon: 'attach_money',
    label: 'Amount',
    value: localisationService.formatCurrency(amount),
    allowCopyToClipboard: false,
  }
}

export function generateReceiptItem({
  value,
  ...receiptItem
}: Omit<PaymentReceiptItem, 'value'> & {
  value: unknown
}): PaymentReceiptItem | undefined {
  if (!value || typeof value !== 'string') {
    return undefined
  }
  return {
    ...receiptItem,
    value,
  }
}
