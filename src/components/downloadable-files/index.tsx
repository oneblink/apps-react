import * as React from 'react'
import {
  submissionService,
  localisationService,
  authService,
} from '@oneblink/apps'
import {
  OnlyPDFDisplay,
  LoadAndDisplayAttachments,
  SingleFileDisplay,
} from './resource-components'
import { LayoutProvider, LayoutType } from './LayoutProvider'

function DownloadableFiles({
  formSubmissionResult,
  divider,
  layout,
}: {
  /** The form submission with the pdf and/or attachments config on it. */
  formSubmissionResult: submissionService.FormSubmissionResult
  /** Whether to render a divider above the content. */
  divider?: boolean
  /**
   * The layout to use for the downloadable files. Options are `GRID` and
   * `LIST`. Defaults to `GRID`. `GRID` will render files next to each other at
   * some screen sizes. `LIST` will always render each file on a new line.
   */
  layout?: LayoutType
}) {
  const submissionPDFFileName = React.useMemo(() => {
    const customFileName =
      formSubmissionResult.definition.postSubmissionReceipt?.allowPDFDownload
        ?.pdfFileName
    if (!customFileName) {
      return 'Submission'
    }

    return localisationService.replaceInjectablesWithSubmissionValues(
      customFileName,
      {
        previousApprovalId:
          formSubmissionResult.previousFormSubmissionApprovalId,
        form: formSubmissionResult.definition,
        submission: formSubmissionResult.submission,
        submissionId: formSubmissionResult.submissionId || '',
        submissionTimestamp: formSubmissionResult.submissionTimestamp || '',
        externalId: formSubmissionResult.externalId || undefined,
        userProfile: authService.getUserProfile() || undefined,
        task: formSubmissionResult.taskCompletion?.task,
        taskGroup: formSubmissionResult.taskCompletion?.taskGroup,
        taskGroupInstance:
          formSubmissionResult.taskCompletion?.taskGroupInstance,
      },
    ).text
  }, [formSubmissionResult])

  const pdfFileNode = React.useMemo(
    () =>
      !formSubmissionResult.downloadSubmissionPdfUrl ? undefined : (
        <SingleFileDisplay
          attachment={{
            filename: submissionPDFFileName,
            signedUrl: formSubmissionResult.downloadSubmissionPdfUrl,
            contentType: 'application/pdf',
          }}
          className="cypress-receipt-download-pdf-button"
        />
      ),
    [
      formSubmissionResult.downloadSubmissionPdfUrl,
      formSubmissionResult.definition,
      submissionPDFFileName,
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

/**
 * Component for rendering post-submission downloadable files such as PDFs and
 * attachments. The only thing required is the `formSubmissionResult`.
 *
 * It is also recommended to import the `css` from this library as well.
 *
 * ```js
 * import { DownloadableFiles } from '@oneblink/apps-react'
 * import '@oneblink/apps-react/dist/styles.css'
 * ```
 *
 * #### Example
 *
 * ```tsx
 * import React from 'react'
 * import ReactDOM from 'react-dom'
 * import { DownloadableFiles } from '@oneblink/apps-react'
 * import '@oneblink/apps-react/dist/styles.css'
 *
 * function SubmissionContainer() {
 *
 *   const [state, setState] = useState(null)
 *
 *   const handleSubmit = React.useCallback(async () => {
 *     ...
 *     setState(result)
 *   }, [])
 *
 *   return (
 *     <div>
 *      ...
 *       {state && (
 *         <DownloadableFiles formSubmissionResult={state} />
 *       )}
 *     </div>
 *   )
 * }
 *
 * function App() {
 *   return (
 *     <IsOfflineContextProvider>
 *       <SubmissionContainer />
 *     </IsOfflineContextProvider>
 *   )
 * }
 *
 * const root = document.getElementById('root')
 * if (root) {
 *   ReactDOM.render(<App />, root)
 * }
 * ```
 *
 * @param props
 * @returns
 * @group Components
 */
export default React.memo(DownloadableFiles)
