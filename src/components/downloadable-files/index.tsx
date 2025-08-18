import * as React from 'react'
import { submissionService } from '@oneblink/apps'
import {
  OnlyPDFDisplay,
  LoadAndDisplayAttachments,
  SingleFileDisplay,
} from './resource-components'
import { LayoutProvider, LayoutType } from './LayoutProvider'

type Props = {
  formSubmissionResult: submissionService.FormSubmissionResult
  divider?: boolean
  layout?: LayoutType
}

const DownloadableFiles = ({
  formSubmissionResult,
  divider,
  layout,
}: Props) => {
  const pdfFileNode = React.useMemo(
    () =>
      !formSubmissionResult.downloadSubmissionPdfUrl ? undefined : (
        <SingleFileDisplay
          attachment={{
            filename:
              formSubmissionResult.definition.postSubmissionReceipt
                ?.allowPDFDownload?.pdfFileName ?? 'Submission',
            signedUrl: formSubmissionResult.downloadSubmissionPdfUrl,
            contentType: 'application/pdf',
          }}
          className="cypress-receipt-download-pdf-button"
        />
      ),
    [
      formSubmissionResult.downloadSubmissionPdfUrl,
      formSubmissionResult.definition,
    ],
  )

  if (!formSubmissionResult.attachmentsAccessToken && !pdfFileNode) {
    return null
  }

  return (
    <div className="ob-downloadable-files__wrapper">
      <LayoutProvider layout={layout ?? 'GRID'}>
        {divider && <hr className="divider" />}
        {pdfFileNode && !formSubmissionResult.attachmentsAccessToken ? (
          <OnlyPDFDisplay>{pdfFileNode}</OnlyPDFDisplay>
        ) : (
          <LoadAndDisplayAttachments
            formSubmissionResult={formSubmissionResult}
            pdfFileNode={pdfFileNode}
          />
        )}
      </LayoutProvider>
    </div>
  )
}

export default React.memo<Props>(DownloadableFiles)
