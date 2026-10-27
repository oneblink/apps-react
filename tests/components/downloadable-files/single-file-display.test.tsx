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

afterEach(() => {
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

describe('SingleFileDisplay receipt download', () => {
  test('shows a try again button when the submission PDF is not ready', async () => {
    downloadSubmissionPdf.mockRejectedValueOnce(
      new SubmissionPdfNotReadyError(
        'The submission is still being processed. Please try again.',
      ),
    )
    const { container, unmount } = await render(true)

    const downloadButton = container.querySelector(
      '.cypress-receipt-download-pdf-button-1',
    )
    expect(downloadButton?.tagName).toBe('BUTTON')

    await React.act(async () => {
      downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(downloadSubmissionPdf).toHaveBeenCalledWith(
      attachment.signedUrl,
      attachment.filename,
    )
    expect(
      container.querySelector('.cypress-pdf-download-not-ready')?.textContent,
    ).toBe('The submission is still being processed. Please try again.')

    downloadSubmissionPdf.mockResolvedValueOnce(undefined)
    const retryButton = container.querySelector(
      '.cypress-retry-pdf-download-button',
    )
    expect(retryButton?.textContent).toBe('Try again')

    await React.act(async () => {
      retryButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(downloadSubmissionPdf).toHaveBeenCalledTimes(2)
    expect(
      container.querySelector('.cypress-pdf-download-not-ready'),
    ).toBeNull()
    expect(reportDownloadError).not.toHaveBeenCalled()

    await unmount()
  })

  test('reports other download failures without a try again button', async () => {
    downloadSubmissionPdf.mockRejectedValueOnce(new Error('network'))
    const { container, unmount } = await render(true)

    await React.act(async () => {
      container
        .querySelector('.cypress-receipt-download-pdf-button-1')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

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
