import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, test, vi } from 'vitest'

const { downloadSubmissionPdf, reportDownloadError } = vi.hoisted(() => ({
  downloadSubmissionPdf: vi.fn(),
  reportDownloadError: vi.fn(),
}))

vi.mock('../../../src/services/download-file', () => {
  class SubmissionPdfNotReadyError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'SubmissionPdfNotReadyError'
    }
  }

  return {
    downloadSubmissionPdf,
    reportDownloadError,
    SubmissionPdfNotReadyError,
  }
})

import { SingleFileDisplay } from '../../../src/components/downloadable-files/resource-components'
import { SubmissionPdfNotReadyError } from '../../../src/services/download-file'

const attachment = {
  filename: 'Submission',
  signedUrl:
    'https://example.test/forms/1/submissions/2/pdf-document?accessToken=token',
  contentType: 'application/pdf',
}

const notReadyError = () =>
  new SubmissionPdfNotReadyError(
    'The submission is still being processed. Please try again.',
  )

afterEach(() => {
  vi.useRealTimers()
  document.body.replaceChildren()
  downloadSubmissionPdf.mockReset()
  reportDownloadError.mockReset()
})

async function render(retryIfSubmissionNotReady?: boolean) {
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  await React.act(async () => {
    root.render(
      <SingleFileDisplay
        attachment={attachment}
        className="cypress-receipt-download-pdf-button-1"
        retryIfSubmissionNotReady={retryIfSubmissionNotReady}
      />,
    )
  })
  return {
    container,
    unmount: () => React.act(async () => root.unmount()),
  }
}

async function click(element: Element | null | undefined) {
  await React.act(async () => {
    element?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

async function advance(ms: number) {
  await React.act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('SingleFileDisplay receipt download', () => {
  test('retries a not-ready submission PDF, then shows try again without a tooltip', async () => {
    downloadSubmissionPdf
      .mockRejectedValueOnce(notReadyError())
      .mockRejectedValueOnce(notReadyError())
      .mockRejectedValueOnce(notReadyError())
    const { container, unmount } = await render(true)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    const downloadButton = container.querySelector(
      '.cypress-receipt-download-pdf-button-1',
    )
    expect(downloadButton?.tagName).toBe('BUTTON')

    await click(downloadButton)

    expect(downloadSubmissionPdf).toHaveBeenCalledWith(
      attachment.signedUrl,
      attachment.filename,
    )
    expect(downloadSubmissionPdf).toHaveBeenCalledTimes(1)
    expect(
      container.querySelector('.cypress-retry-pdf-download-button'),
    ).toBeNull()

    await advance(999)
    expect(downloadSubmissionPdf).toHaveBeenCalledTimes(1)

    await advance(1)
    expect(downloadSubmissionPdf).toHaveBeenCalledTimes(2)
    expect(
      container.querySelector('.cypress-pdf-download-not-ready'),
    ).toBeNull()

    await advance(4999)
    expect(downloadSubmissionPdf).toHaveBeenCalledTimes(2)

    await advance(1)
    expect(downloadSubmissionPdf).toHaveBeenCalledTimes(3)
    expect(
      container.querySelector('.cypress-pdf-download-not-ready')?.textContent,
    ).toBe('The submission is still being processed. Please try again.')

    const retryButton = container.querySelector(
      '.cypress-retry-pdf-download-button',
    )
    expect(retryButton?.textContent).toBe('Try again')
    expect(retryButton?.getAttribute('title')).toBeNull()
    expect(downloadButton?.parentElement?.contains(retryButton ?? null)).toBe(
      false,
    )

    downloadSubmissionPdf.mockResolvedValueOnce(undefined)
    await click(retryButton)

    expect(downloadSubmissionPdf).toHaveBeenCalledTimes(4)
    expect(
      container.querySelector('.cypress-pdf-download-not-ready'),
    ).toBeNull()
    expect(reportDownloadError).not.toHaveBeenCalled()

    await unmount()
  })

  test('stops retrying when a later attempt succeeds', async () => {
    downloadSubmissionPdf
      .mockRejectedValueOnce(notReadyError())
      .mockResolvedValueOnce(undefined)
    const { container, unmount } = await render(true)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    await click(
      container.querySelector('.cypress-receipt-download-pdf-button-1'),
    )
    expect(downloadSubmissionPdf).toHaveBeenCalledTimes(1)

    await advance(1000)
    expect(downloadSubmissionPdf).toHaveBeenCalledTimes(2)
    expect(
      container.querySelector('.cypress-retry-pdf-download-button'),
    ).toBeNull()
    expect(reportDownloadError).not.toHaveBeenCalled()

    await unmount()
  })

  test('reports other download failures without a try again button', async () => {
    downloadSubmissionPdf.mockRejectedValueOnce(new Error('network'))
    const { container, unmount } = await render(true)

    await click(
      container.querySelector('.cypress-receipt-download-pdf-button-1'),
    )

    expect(downloadSubmissionPdf).toHaveBeenCalledTimes(1)
    expect(reportDownloadError).toHaveBeenCalledWith(expect.any(Error))
    expect(
      container.querySelector('.cypress-retry-pdf-download-button'),
    ).toBeNull()

    await unmount()
  })

  test('leaves attachment links as a normal download', async () => {
    const { container, unmount } = await render(false)
    const link = container.querySelector(
      '.cypress-receipt-download-pdf-button-1',
    )

    expect(link?.tagName).toBe('A')
    expect(link?.getAttribute('href')).toBe(attachment.signedUrl)
    expect(
      container.querySelector('.cypress-retry-pdf-download-button'),
    ).toBeNull()

    await unmount()
  })
})
