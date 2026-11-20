import { afterEach, describe, expect, it, vi } from 'vitest'
import { FormTypes } from '@oneblink/types'
import {
  reviewFormSubmissionPaymentRequest,
  startFormSubmissionPaymentRequest,
} from '../../src/apps/payment-service'
import OneBlinkAppsError from '../../src/apps/services/errors/oneBlinkAppsError'
import { rememberPaymentSubmissionResult } from '../../src/apps/services/payment-submission-result'

vi.mock('../../src/apps/services/payment-submission-result', () => ({
  rememberPaymentSubmissionResult: vi.fn(),
}))

describe('startFormSubmissionPaymentRequest()', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.mocked(rememberPaymentSubmissionResult).mockClear()
  })

  it('remembers the reviewed submission without the submitter receipt', async () => {
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

    const submission = { name: 'Ada' }
    await startFormSubmissionPaymentRequest('token-1', {
      form: {
        id: 1,
        name: 'Form',
        postSubmissionReceipt: { html: '<p>Thanks {ELEMENT:name}</p>' },
      } as FormTypes.Form,
      submission,
      submissionId: 'submission-1',
      paymentReceiptUrl: 'https://forms.example/payment-receipt',
      paymentFormUrl: 'https://forms.example/payment-form',
    })

    expect(rememberPaymentSubmissionResult).toHaveBeenCalledWith(
      expect.objectContaining({
        submission,
        submissionId: 'submission-1',
        definition: expect.objectContaining({ id: 1, name: 'Form' }),
        payment: expect.objectContaining({
          amount: 43,
          paymentReceiptUrl: 'https://forms.example/payment-receipt',
          paymentFormUrl: 'https://forms.example/payment-form',
          hostedFormUrl: 'https://pay.example/checkout',
        }),
      }),
    )
    const stored = vi.mocked(rememberPaymentSubmissionResult).mock.calls[0]?.[0]
    expect(stored?.definition.postSubmissionReceipt).toBeUndefined()

    const paymentRequest = vi
      .mocked(fetch)
      .mock.calls.find(([url]) =>
        String(url).endsWith('/form-submission-payment-requests/start'),
      )
    expect(JSON.parse(String(paymentRequest?.[1]?.body))).toEqual({
      paymentRequestToken: 'token-1',
    })
  })
})

describe('payment request errors', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws a friendly OneBlinkAppsError for a known conflict', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 409,
        json: async () => ({
          message:
            'FormSubmissionApproval for this payment request is APPROVED and paymentSkipped is not set.',
          conflict: 'PAYMENT_REQUEST_ALREADY_PAID',
        }),
      })),
    )

    const error = await startFormSubmissionPaymentRequest('token-1', {
      form: { id: 1 } as FormTypes.Form,
      submission: {},
      submissionId: 'submission-1',
      paymentReceiptUrl: 'https://forms.example/payment-receipt',
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(OneBlinkAppsError)
    expect(error).toMatchObject({
      message: 'This payment has already been completed.',
      httpStatusCode: 409,
      conflict: 'PAYMENT_REQUEST_ALREADY_PAID',
    })
    expect(rememberPaymentSubmissionResult).not.toHaveBeenCalled()
  })

  it('loads the submission with GET and the payment token header', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        form: { id: 1 },
        submission: {},
        submissionId: 'submission-1',
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    await reviewFormSubmissionPaymentRequest('token-1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        '/storage/form-submission-payment-requests/review',
      ),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-oneblink-request-body': JSON.stringify({
            paymentRequestToken: 'token-1',
          }),
        }),
      }),
    )
  })

  it('uses the unavailable message for an unknown conflict', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 409,
        json: async () => ({
          message: 'Something a developer would read.',
          conflict: 'OTHER',
        }),
      })),
    )

    const error = await reviewFormSubmissionPaymentRequest('token-1').catch(
      (caught: unknown) => caught,
    )

    expect(error).toBeInstanceOf(OneBlinkAppsError)
    expect(error).toMatchObject({
      message: 'This payment request is no longer available.',
      conflict: 'OTHER',
    })
  })

  it('marks a 401 as requiring login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'You do not have access to this service',
        }),
      })),
    )

    const error = await reviewFormSubmissionPaymentRequest('token-1').catch(
      (caught: unknown) => caught,
    )

    expect(error).toBeInstanceOf(OneBlinkAppsError)
    expect(error).toMatchObject({
      httpStatusCode: 401,
      requiresLogin: true,
    })
  })

  it('rejects a review link with no token before calling the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const error = await reviewFormSubmissionPaymentRequest('').catch(
      (caught: unknown) => caught,
    )

    expect(error).toBeInstanceOf(OneBlinkAppsError)
    expect(error).toMatchObject({
      message: 'This payment link is not valid.',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
