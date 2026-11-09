import { afterEach, describe, expect, it, vi } from 'vitest'
import { FormTypes } from '@oneblink/types'
import {
  createApprovalStepPayment,
  PAYMENT_IN_PROGRESS_CONFLICT,
} from '../../src/apps/approvals-service'
import OneBlinkAppsError from '../../src/apps/services/errors/oneBlinkAppsError'

describe('createApprovalStepPayment()', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
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
  })
})
