import * as React from 'react'
import { Collapse, Grid, LinearProgress, Tooltip } from '@mui/material'
import MaterialIcon from '../MaterialIcon'
import { submissionService } from '@oneblink/apps'
import useLoadDataState from '../../hooks/useLoadDataState'
import OneBlinkAppsErrorOriginalMessage from '../renderer/OneBlinkAppsErrorOriginalMessage'
import clsx from 'clsx'
import { useLayout } from './LayoutProvider'

type Attachment = Awaited<
  ReturnType<typeof submissionService.getPostSubmissionAttachments>
>[number]

export const LoadAndDisplayAttachments = ({
  pdfFileNode,
  formSubmissionResult,
}: {
  pdfFileNode: React.ReactNode
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
        {pdfFileNode && (
          <>
            <OnlyPDFDisplay className="ob-downloadable-files__error-pdf">
              {pdfFileNode}
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
          pdfFileNode={pdfFileNode}
        />
      </Collapse>
    </>
  )
}

type DownloadableFilesDisplayProps = {
  attachments: Attachment[]
  pdfFileNode?: React.ReactNode
}
function DownloadableFilesDisplay({
  attachments,
  pdfFileNode,
}: DownloadableFilesDisplayProps) {
  const layout = useLayout()

  const totalToDisplay = React.useMemo(() => {
    return attachments.length + (pdfFileNode ? 1 : 0)
  }, [attachments, pdfFileNode])

  const largeBreakpointColumnWidth = React.useMemo(
    () =>
      // Don't use a 3 column layout (4) unless we have at least 3 attachments to show
      totalToDisplay > 2 ? 4 : 6,
    [totalToDisplay],
  )

  return (
    <>
      <div className="ob-downloadable-files__container">
        <Grid
          container
          spacing={2}
          justifyContent={totalToDisplay === 1 ? 'center' : undefined}
        >
          {pdfFileNode && (
            <Grid
              item
              xs={12}
              sm={layout === 'GRID' ? 6 : 12}
              lg={layout === 'GRID' ? largeBreakpointColumnWidth : 12}
            >
              {pdfFileNode}
            </Grid>
          )}
          {attachments.map((attachment, index) => (
            <Grid
              item
              xs={12}
              sm={layout === 'GRID' ? 6 : 12}
              lg={layout === 'GRID' ? largeBreakpointColumnWidth : 12}
              key={index}
            >
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

export const SingleFileDisplay = ({
  attachment,
  className,
}: {
  attachment: Attachment
  className?: string
}) => {
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

  return (
    <Tooltip title={attachment.filename} arrow>
      <a
        href={attachment.signedUrl}
        target="_blank"
        rel="noreferrer"
        download
        className={clsx('ob-downloadable-files__item', className)}
      >
        {avatar}
        <div className="ob-downloadable-files__content">
          <div className="ob-downloadable-files__filename ob-downloadable-files__text">
            {attachment.filename}
          </div>
          <div className="ob-downloadable-files__filetype ob-downloadable-files__text">
            {attachment.contentType.split('/')[1] || 'Unknown'}
          </div>
        </div>
        <MaterialIcon className="ob-downloadable-files__download-icon">
          download
        </MaterialIcon>
      </a>
    </Tooltip>
  )
}

/** Centers the PDF Download button */
export const OnlyPDFDisplay = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  const layout = useLayout()

  return (
    <div className={clsx('ob-downloadable-files__container', className)}>
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12} sm={layout === 'GRID' ? 6 : 12}>
          {children}
        </Grid>
      </Grid>
    </div>
  )
}
