import * as React from 'react'
import { Collapse, Grid, LinearProgress, Tooltip } from '@mui/material'
import MaterialIcon from '../MaterialIcon'
import { submissionService } from '../../apps'
import useLoadDataState from '../../hooks/useLoadDataState'
import OneBlinkAppsErrorOriginalMessage from '../renderer/OneBlinkAppsErrorOriginalMessage'
import clsx from 'clsx'
import { useLayout } from './LayoutProvider'
import {
  downloadSubmissionPdf,
  reportDownloadError,
  SubmissionPdfNotReadyError,
} from '../../services/download-file'

type Attachment = Awaited<
  ReturnType<typeof submissionService.getPostSubmissionAttachments>
>[number]

export const LoadAndDisplayAttachments = ({
  pdfFileNodes,
  formSubmissionResult,
}: {
  pdfFileNodes?: PDFFileNode[]
  formSubmissionResult: submissionService.FormSubmissionResult
}) => {
  const loadAttachments = React.useCallback(
    () => submissionService.getPostSubmissionAttachments(formSubmissionResult),
    [formSubmissionResult],
  )
  const [attachmentsState] = useLoadDataState(loadAttachments)

  return (
    <>
      <Collapse in={attachmentsState.status === 'LOADING'} unmountOnExit>
        <div className="ob-downloadable-files__loading">
          <div className="ob-list__text-secondary mb-1 has-text-centered">
            Loading Attachments...
          </div>
          <LinearProgress className="ob-progress__downloadable-files" />
        </div>
      </Collapse>
      <Collapse in={attachmentsState.status === 'ERROR'} unmountOnExit>
        {!!pdfFileNodes?.length && (
          <>
            <OnlyPDFDisplay className="ob-downloadable-files__error-pdf">
              {pdfFileNodes}
            </OnlyPDFDisplay>
          </>
        )}

        <div className="ob-downloadable-files__error has-text-centered">
          <MaterialIcon className="has-text-danger icon-large">
            error
          </MaterialIcon>
          <OneBlinkAppsErrorOriginalMessage
            error={
              attachmentsState.status === 'ERROR'
                ? attachmentsState.error
                : undefined
            }
          />
        </div>
      </Collapse>
      <Collapse in={attachmentsState.status === 'SUCCESS'} unmountOnExit>
        <DownloadableFilesDisplay
          attachments={
            attachmentsState.status === 'SUCCESS' ? attachmentsState.result : []
          }
          pdfFileNodes={pdfFileNodes}
        />
      </Collapse>
    </>
  )
}

export type PDFFileNode = {
  key: string
  node: React.ReactNode
}

type DownloadableFilesDisplayProps = {
  attachments: Attachment[]
  pdfFileNodes?: PDFFileNode[]
}
function DownloadableFilesDisplay({
  attachments,
  pdfFileNodes,
}: DownloadableFilesDisplayProps) {
  const layout = useLayout()

  const totalToDisplay = React.useMemo(() => {
    return attachments.length + (pdfFileNodes?.length ?? 0)
  }, [attachments, pdfFileNodes])

  return (
    <>
      <div className="ob-downloadable-files__container">
        <Grid
          container
          spacing={2}
          justifyContent={totalToDisplay === 1 ? 'center' : undefined}
        >
          {pdfFileNodes &&
            pdfFileNodes.map(({ node, key }) => (
              <Grid size={{ xs: 12, sm: layout === 'GRID' ? 6 : 12 }} key={key}>
                {node}
              </Grid>
            ))}
          {attachments.map((attachment, index) => (
            <Grid size={{ xs: 12, sm: layout === 'GRID' ? 6 : 12 }} key={index}>
              <SingleFileDisplay attachment={attachment} />
            </Grid>
          ))}
        </Grid>
      </div>
    </>
  )
}

const getFileTypeIcon = (type: string) => {
  // Add other appropriate icons for file types here anytime
  if (type.includes('doc')) {
    return 'description'
  }
  return 'attach_file'
}

/** Waits between attempts after the first download. Three attempts in total. */
const SUBMISSION_PDF_RETRY_DELAYS_MS = [1000, 5000]

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const SingleFileDisplay = ({
  attachment,
  className,
  retryIfSubmissionNotReady,
}: {
  attachment: Attachment
  className?: string
  /**
   * Download the file in the page instead of navigating away. When the
   * submission PDF is not ready yet, retry with a backoff, then show the error
   * and a Try again button.
   */
  retryIfSubmissionNotReady?: boolean
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [notReadyMessage, setNotReadyMessage] = React.useState<string>()
  const requestIdRef = React.useRef(0)
  React.useEffect(() => {
    return () => {
      requestIdRef.current += 1
    }
  }, [])
  const { avatar } = React.useMemo(() => {
    const avatar = () => {
      return attachment.contentType.includes('image') ? (
        <img
          src={attachment.signedUrl}
          alt={attachment.filename}
          className="ob-downloadable-files__thumbnail"
        />
      ) : (
        <MaterialIcon className="ob-downloadable-files__icon">
          {getFileTypeIcon(attachment.contentType)}
        </MaterialIcon>
      )
    }

    return { avatar: avatar() }
  }, [attachment.filename, attachment.contentType, attachment.signedUrl])

  const download = React.useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsDownloading(true)
    setNotReadyMessage(undefined)
    try {
      for (
        let attempt = 0;
        attempt <= SUBMISSION_PDF_RETRY_DELAYS_MS.length;
        attempt++
      ) {
        if (requestId !== requestIdRef.current) {
          return
        }
        try {
          await downloadSubmissionPdf(attachment.signedUrl, attachment.filename)
          return
        } catch (error) {
          if (requestId !== requestIdRef.current) {
            return
          }
          const retryDelay = SUBMISSION_PDF_RETRY_DELAYS_MS[attempt]
          if (
            error instanceof SubmissionPdfNotReadyError &&
            retryDelay !== undefined
          ) {
            await delay(retryDelay)
            continue
          }
          if (error instanceof SubmissionPdfNotReadyError) {
            setNotReadyMessage(error.message)
            return
          }
          reportDownloadError(error instanceof Error ? error : undefined)
          return
        }
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsDownloading(false)
      }
    }
  }, [attachment.filename, attachment.signedUrl])

  const fileDetails = (
    <>
      {avatar}
      <div className="ob-downloadable-files__content">
        <div className="ob-downloadable-files__filename ob-downloadable-files__text">
          {attachment.filename}
        </div>
        <div className="ob-downloadable-files__filetype ob-downloadable-files__text">
          {isDownloading
            ? 'Downloading...'
            : attachment.contentType.split('/')[1] || 'Unknown'}
        </div>
      </div>
      <MaterialIcon className="ob-downloadable-files__download-icon">
        download
      </MaterialIcon>
    </>
  )

  const fileButton = retryIfSubmissionNotReady ? (
    <button
      type="button"
      disabled={isDownloading}
      onClick={() => {
        void download()
      }}
      className={clsx('ob-downloadable-files__item', className)}
    >
      {fileDetails}
    </button>
  ) : (
    <a
      href={attachment.signedUrl}
      target="_blank"
      rel="noreferrer"
      download
      className={clsx('ob-downloadable-files__item', className)}
    >
      {fileDetails}
    </a>
  )

  return (
    <div>
      <Tooltip title={attachment.filename} arrow>
        <div>{fileButton}</div>
      </Tooltip>
      {notReadyMessage && (
        <div className="ob-downloadable-files__not-ready">
          <p className="cypress-pdf-download-not-ready">{notReadyMessage}</p>
          <button
            type="button"
            className="button ob-button is-primary cypress-retry-pdf-download-button"
            disabled={isDownloading}
            onClick={() => {
              void download()
            }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

/** Centers the PDF Download button */
export const OnlyPDFDisplay = ({
  children,
  className,
}: {
  children: PDFFileNode[]
  className?: string
}) => {
  const layout = useLayout()

  return (
    <div className={clsx('ob-downloadable-files__container', className)}>
      <Grid
        container
        spacing={2}
        justifyContent={children.length === 1 ? 'center' : undefined}
      >
        {children.map(({ node, key }) => (
          <Grid size={{ xs: 12, sm: layout === 'GRID' ? 6 : 12 }} key={key}>
            {node}
          </Grid>
        ))}
      </Grid>
    </div>
  )
}
