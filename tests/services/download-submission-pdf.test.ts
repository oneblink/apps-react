import { afterEach, describe, expect, test, vi } from 'vitest'
import fileSaver from 'file-saver'
import {
  downloadSubmissionPdf,
  SUBMISSION_PDF_NOT_READY_MESSAGE,
  SubmissionPdfNotReadyError,
} from '../../src/services/download-file'

vi.mock('file-saver', () => ({
  default: {
    saveAs: vi.fn(),
  },
}))

function response({
  status,
  body,
  blob = new Blob(['pdf'], { type: 'application/pdf' }),
  jsonError,
}: {
  status: number
  body?: unknown
  blob?: Blob
  jsonError?: boolean
}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jsonError
      ? async () => {
          throw new Error('not json')
        }
      : async () => body,
    blob: async () => blob,
  } as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.mocked(fileSaver.saveAs).mockReset()
})

describe('downloadSubmissionPdf', () => {
  test('saves a receipt PDF and adds the pdf extension', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ status: 200, blob })),
    )

    await downloadSubmissionPdf(
      'https://example.test/forms/1/submissions/2/pdf-document?accessToken=token',
      'Submission',
    )

    expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, 'Submission.pdf')
  })

  test('keeps a filename that already ends in pdf', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ status: 200, blob })),
    )

    await downloadSubmissionPdf('https://example.test/pdf', 'Receipt.PDF')

    expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, 'Receipt.PDF')
  })

  test('throws when the submission is still being processed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response({
          status: 409,
          body: {
            statusCode: 409,
            error: 'Conflict',
            message: SUBMISSION_PDF_NOT_READY_MESSAGE,
          },
        }),
      ),
    )

    await expect(
      downloadSubmissionPdf('https://example.test/pdf', 'Submission'),
    ).rejects.toBeInstanceOf(SubmissionPdfNotReadyError)
    expect(fileSaver.saveAs).not.toHaveBeenCalled()
  })

  test('throws a download error for other failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response({
          status: 500,
          body: { message: 'Something else' },
        }),
      ),
    )

    await expect(
      downloadSubmissionPdf('https://example.test/pdf', 'Submission'),
    ).rejects.toThrow('Unable to download file. HTTP Status Code: 500')
    expect(fileSaver.saveAs).not.toHaveBeenCalled()
  })

  test('throws a download error when a 409 body is not the not-ready message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response({
          status: 409,
          jsonError: true,
        }),
      ),
    )

    await expect(
      downloadSubmissionPdf('https://example.test/pdf', 'Submission'),
    ).rejects.toThrow('Unable to download file. HTTP Status Code: 409')
  })
})
