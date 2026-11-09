import { afterEach, describe, expect, it, vi } from 'vitest'
import { FormTypes } from '@oneblink/types'
import {
  createApprovalStepPayment,
  PAYMENT_IN_PROGRESS_CONFLICT,
} from '../../src/apps/approvals-service'
import OneBlinkAppsError from '../../src/apps/services/errors/oneBlinkAppsError'
import { rememberPaymentSubmissionResult } from '../../src/apps/services/payment-submission-result'

vi.mock('../../src/apps/services/payment-submission-result', () => ({
  rememberPaymentSubmissionResult: vi.fn(),
}))

describe('createApprovalStepPayment()', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.mocked(rememberPaymentSubmissionResult).mockClear()
  })

  it('throws PAYMENT_IN_PROGRESS when a checkout is already pending', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 409,
        json: async () => ({
          statusCode: 409,
          error: 'Conflict',
          message: 'A payment is already in progress for this step',
          conflict: PAYMENT_IN_PROGRESS_CONFLICT,
        }),
      })),
    )

    const error = await createApprovalStepPayment('approval-1', {
      redirectUrl: 'https://approvals.example/return',
      form: { id: 1 } as FormTypes.Form,
      submissionId: 'submission-1',
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(OneBlinkAppsError)
    expect(error).toMatchObject({
      conflict: PAYMENT_IN_PROGRESS_CONFLICT,
      httpStatusCode: 409,
      message:
        'A payment is already in progress for this step. Finish or cancel that payment before starting another.',
    })
    expect(rememberPaymentSubmissionResult).not.toHaveBeenCalled()
  })

  it('remembers the payment without the submitter receipt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          hostedFormUrl: 'https://pay.example/checkout',
          amount: 43,
          paymentSubmissionEvent: {
            type: 'BPOINT',
            configuration: { environmentId: 'env' },
          },
        }),
      })),
    )

    await createApprovalStepPayment('approval-1', {
      redirectUrl: 'https://approvals.example/return',
      paymentFormUrl: 'https://approvals.example/pay',
      form: {
        id: 1,
        name: 'Form',
        postSubmissionReceipt: { html: '<p>Thanks {ELEMENT:name}</p>' },
      } as FormTypes.Form,
      submissionId: 'submission-1',
      replacePendingPayment: true,
    })

    expect(rememberPaymentSubmissionResult).toHaveBeenCalledWith(
      expect.objectContaining({
        submission: {},
        submissionId: 'submission-1',
        definition: expect.objectContaining({ id: 1, name: 'Form' }),
      }),
    )
    const stored = vi.mocked(rememberPaymentSubmissionResult).mock.calls[0]?.[0]
    expect(stored?.definition.postSubmissionReceipt).toBeUndefined()

    const paymentRequest = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).endsWith('/payment'))
    expect(JSON.parse(String(paymentRequest?.[1]?.body))).toMatchObject({
      redirectUrl: 'https://approvals.example/return',
      paymentFormUrl: 'https://approvals.example/pay',
      replacePendingPayment: true,
    })
  })
})
